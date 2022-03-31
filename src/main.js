/* A simple stateful wrapper around a DataView that keeps track of the current offset.*/

class DataViewReader {
  constructor(dataViewOrBuffer) {
    if (dataViewOrBuffer instanceof DataView) {
      this.dataView = dataViewOrBuffer;
    } else if (dataViewOrBuffer instanceof ArrayBuffer) {
      this.dataView = new DataView(dataViewOrBuffer);
    }
    this.offset = 0;
  }

  /* Variable length accessors */

  readBytes(length) {
    const buffer = new DataView(this.dataView.buffer, this.offset, length)
    this.offset += length;
    return buffer;
  }

  readAndASCIIDecodeBytes(length) {
    const array = new Uint8Array(this.dataView.buffer, this.offset, length)
    this.offset += length;
    return this._decodeASCIIByteArray(array);
  }

  /* Fixed length accessors */

  readUint8(littleEndian = false) {
    const value = this.dataView.getUint8(this.offset, littleEndian);
    this.offset += Uint8Array.BYTES_PER_ELEMENT;
    return value;
  }

  readUint16(littleEndian = false) {
    const value = this.dataView.getUint16(this.offset, littleEndian);
    this.offset += Uint16Array.BYTES_PER_ELEMENT;
    return value;
  }

  readUint32(littleEndian = false) {
    const value = this.dataView.getUint32(this.offset, littleEndian);
    this.offset += Uint32Array.BYTES_PER_ELEMENT;
    return value;
  }

  /* Helpers */

  _decodeASCIIByteArray(array) {
    const characters = []
    for (const byte of array) {
      const char = String.fromCharCode(byte);
      characters.push(char);
    }
    return characters.join('');
  }
}


export function fromArrayBuffer(buffer) {
  if (!buffer instanceof ArrayBuffer) {
    throw new Error('Argument must be an ArrayBuffer.');
  }
  const reader = new DataViewReader(buffer);
  // comments are taken from https://docs.scipy.org/doc/numpy-1.14.1/neps/npy-format.html#format-specification-version-1-0
  // "The first 6 bytes are a magic string: exactly "x93NUMPY""
  const magicByte = reader.readUint8();
  const magicWord = reader.readAndASCIIDecodeBytes(5);
  if (magicByte != 0x93 || magicWord != 'NUMPY') {
      throw new Error(`unknown file type: "${magicByte}${magicWord}"`);
  }
  // "The next 1 byte is an unsigned byte: the major version number of the file format, e.g. x01.""
  const versionMajor = reader.readUint8();
  // "The next 1 byte is an unsigned byte: the minor version number of the file format, e.g. x00."
  const versionMinor = reader.readUint8();
  // Parse header length. This depends on the major file format version as follows:
  let headerLength;
  if (versionMajor <= 1) {
    // "The next 2 bytes form a little-endian unsigned short int: the length of the header data HEADER_LEN."
    headerLength = reader.readUint16(true);
  } else {
    // "The next 4 bytes form a little-endian unsigned int: the length of the header data HEADER_LEN."
    headerLength = reader.readUint32(true);
  }
  /* "The next HEADER_LEN bytes form the header data describing the array’s format.
  It is an ASCII string which contains a Python literal expression of a dictionary.
  It is terminated by a newline (‘n’) and padded with spaces (‘x20’) to make the total
  length of the magic string + 4 + HEADER_LEN be evenly divisible by 16." */
  const preludeLength = 6 + 4 + headerLength;
  if (preludeLength % 16 != 0) {
    console.warn(`NPY file header is incorrectly padded. (${preludeLength} is not evenly divisible by 16.)`)
  }
	const headerStr = reader.readAndASCIIDecodeBytes(headerLength);
  const header = parseHeaderStr(headerStr);
  if (header.fortran_order) {
    throw new Error('NPY file is written in Fortran byte order, support for this byte order is not yet implemented.')
  }
  // Intepret the bytes according to the specified dtype
  const constructor = typedArrayConstructorForDescription(header.descr);
  const data = new constructor(buffer, reader.offset);
  // Return object with same signature as NDArray expects: {data, shape}
  return { data: data, shape: header.shape };
}


function parseHeaderStr(headerStr) {
  const jsonHeader = headerStr
    .toLowerCase() // boolean literals: False -> false
    .replace('(','[').replace('),',']') // Python tuple to JS array: (10,) -> [10,]
    .replace(',]',']') // trailing comma (for 1-d array): [10,] -> [10]
    .replace(/'/g, '"'); // single quotes -> double quotes
  return JSON.parse(jsonHeader);
}


function typedArrayConstructorForDescription(dtypeDescription) {
  /* 'dtype' description strings consist of three characters, indicating one of three
     properties each: byte order, data type, and byte length.

     Byte order: '<' (little-endian), '>' (big-endian), or '|' (not applicable)
     Data type: 'u' (unsigned), 'i' (signed integer), 'f' (floating)
     Byte Length: 1, 2, 4 or 8 bytes

     Note that for 1 byte dtypes there is no byte order, thus the use of '|' (not applicable).
     Data types are specified in numpy source:
     https://github.com/numpy/numpy/blob/8aa121415760cc6839a546c3f84e238d1dfa1aa6/numpy/core/_dtype.py#L13
   */
  switch (dtypeDescription) {

    // Unsigned Integers
    case '|u1':
      return Uint8Array;
    case '<u2':
      return Uint16Array;
    case '<u4':
      return Uint32Array;
    case '<u8':
      throw new Error('Because JavaScript doesn\'t currently include standard support for 64-bit unsigned integer values, support for this dtype is not yet implemented.');

    // Integers
    case '|i1': // "byte"
      return Int8Array;
    case '<i2': // "short"
      return Int16Array;
    case '<i4': // "intc"
      return Int32Array;
    case '<i8': // "longlong" (??)
      throw new Error('Because JavaScript doesn\'t currently include standard support for 64-bit integer values, support for this dtype is not yet implemented.');

    // Floating
    case '<f2': // "half"
      throw new Error('Because JavaScript doesn\'t currently include standard support for 16-bit floating point values, support for this dtype is not yet implemented.');
    case '<f4': // "single"
      return Float32Array;
    case '<f8': // "double" "longfloat"
      return Float64Array;

    // No support for ComplexFloating, on-number types (flexible/character/void...) yet

    default:
      throw new Error('Unknown or not yet implemented numpy dtype description: ' + dtype);
  }
}
