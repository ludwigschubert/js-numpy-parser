import assert from 'assert';
import { fromArrayBuffer } from '../src/main.js';
import { assertApproximate, loadArrayBuffer } from './util.js';


describe('NumpyParser', () => {

  describe('#fromArrayBuffer())', () => {

    it('should return an object with "data" and "shape" properties', () => {
      const arrayBuffer = loadArrayBuffer('./test/data/uint8-(1,).npy');
      const typedArrayObject = fromArrayBuffer(arrayBuffer);

      assert.deepEqual(Object.keys(typedArrayObject), ['data', 'shape']);
      assert.equal(typedArrayObject.data.length, 1);
    });


    const sum = (array) => array.reduce( (acc, value) => acc + value, 0);
    const norm = (array) => Math.sqrt(array.reduce( (acc, value) => acc + Math.pow(value, 2), 0));

    const dtypes = ["float32", "float64", "int8", "int16", "int32", "uint8", "uint16", "uint32"];
    const shapes = ["(1,)", "(4,)", "(1, 4)", "(4, 4)", "(4, 4, 4)"];
    dtypes.forEach(function(dtype) {
      shapes.forEach(function(shape) {
        it('correctly parsers a ' + dtype + ' array of shape ' + shape, () => {
          const arrayBuffer = loadArrayBuffer(`./test/data/${dtype}-${shape}.npy`);
          const { data: array } = fromArrayBuffer(arrayBuffer);

          if (dtype.includes("uint")) {
            assert.equal(sum(array), 42);
          } else if (dtype.includes("int")) {
            assert.equal(sum(array), -42);
          } else if (dtype.includes("float")) {
            assertApproximate(norm(array), 1.0);
          }
        });
      });
    });

  });

});
