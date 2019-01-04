const assert = require('assert');
const fs = require('fs')
const NumpyParser = require('../src/main.js');

// Helper function to load test data from disk
function loadArray(file) {
  const buffer = fs.readFileSync(file);
  const arrayBuffer = new Uint8Array(buffer).buffer; // only needed for node conversion
  return NumpyParser.fromArrayBuffer(arrayBuffer);
}

function sum(array) {
  var total = 0;
  for (const entry of array) {
    total += entry
  }
  return total;
}

function norm(array) {
  var total = 0;
  for (const entry of array) {
    total += Math.pow(entry, 2)
  }
  return Math.sqrt(total);
}

function assertApproximate(actual, expected) {
  const epsilon = 1e-6;
  const delta = Math.abs(actual - expected);
  assert(delta < epsilon);
}


describe('NumpyParser', function() {

  describe('#fromArrayBuffer())', function() {

    it('should return an object with "data" and "shape" properties', function() {
      const typedArray = loadArray('./test/data/uint8-(1,).npy')

      assert.deepEqual(Object.keys(typedArray), ['data', 'shape']);
      assert.equal(typedArray.data.length, 1);
    });

    const dtypes = ["float32", "float64", "int8", "int16", "int32", "uint8", "uint16", "uint32"];
    const shapes = ["(1,)", "(4,)", "(1, 4)", "(4, 4)", "(4, 4, 4)"];

    dtypes.forEach(function(dtype) {
      shapes.forEach(function(shape) {
        it('correctly parsers a ' + dtype + ' array of shape ' + shape, function() {
          const result = loadArray(`./test/data/${dtype}-${shape}.npy`);
          const array = result.data;

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
