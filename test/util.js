import fs from 'fs';
import assert from 'assert';


export function loadArrayBuffer(file) {
  const buffer = fs.readFileSync(file);
  return new Uint8Array(buffer).buffer; // only needed for node conversion
}


export function assertApproximate(actual, expected) {
  const epsilon = 1e-6;
  const delta = Math.abs(actual - expected);
  assert(delta < epsilon);
}
