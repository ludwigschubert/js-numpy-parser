/* A simple stateful wrapper around a DataView that keeps track of the current offset.*/

export default class DataViewReader {
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
}
