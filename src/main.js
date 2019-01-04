function asciiDecode(buffer) {
  const castBuffer = new Uint8Array(buffer);
  return String.fromCharCode(...castBuffer);
}

function readUint16LE(buffer) {
    const view = new DataView(buffer);
    var value = view.getUint8(0);
    value |= view.getUint8(1) << 8;
    return value;
}

function typedArrayFromBuffer(dtype, buffer, offset) {
  switch (dtype) {

    // Unsigned Integer
    case '|u1':
      return new Uint8Array(buffer, offset);
    case '<u2':
      return new Uint16Array(buffer, offset);
    case '<u4':
      return new Uint32Array(buffer, offset);

    // Integer
    case '|i1':
      return new Int8Array(buffer, offset);
    case '<i2':
      return new Int16Array(buffer, offset);
    case '<i4':
      return new Int32Array(buffer, offset);

    // Floating Point
    case '<f4':
      return new Float32Array(buffer, offset);
    case '<f8':
      return new Float64Array(buffer, offset);

    default:
      throw new Error('unknown numeric dtype: ' + header.descr);
  }
}

function fromArrayBuffer(buffer) {
  // check the magic number
  const magic = asciiDecode(buffer.slice(0,6));
  if (magic.slice(1,6) != 'NUMPY') {
      throw new Error(`unknown file type: "${magic}"`);
  }

  // read the header
  const version = new Uint8Array(buffer.slice(6, 8)),
        headerLength = readUint16LE(buffer.slice(8, 10)),
        headerStr = asciiDecode(buffer.slice(10, 10 + headerLength)),
        offsetBytes = 10 + headerLength;
  const jsonHeader = headerStr
    .toLowerCase() // fixes boolean literals: False -> false
    .replace('(','[').replace('),',']') // shape tuple to array: (10,) -> [10,]
    .replace('[,','[1,]').replace(',]',',1]') // implicit dimensions: [10,] -> [10,1]
    .replace(/'/g, '"'); // fixes single quotes
  const header = JSON.parse(jsonHeader);
  if (header.fortran_order) {
    throw new Error('file is in Fortran byte order; giving up')
  }

  // Intepret the bytes according to the specified dtype
  const data = typedArrayFromBuffer(header.descr, buffer, offsetBytes);

  return { data: data, shape: header.shape };
}

module.exports = {
    fromArrayBuffer: fromArrayBuffer
};
