import numpy as np
import os
from itertools import product


FOLDER = "test/data"

shapes = [(1,), (4,), (1, 4), (4, 4), (4, 4, 4)]

js_typed_array_dtypes = [
    np.int8,
    np.uint8,
    np.int16,
    np.uint16,
    np.int32,
    np.uint32,
    np.float32,
    np.float64,
]

os.makedirs(FOLDER, exist_ok=True)

# write number test cases
for dtype, shape in product(js_typed_array_dtypes, shapes):

    # create random data with enough structure to check if parsing was successful
    if issubclass(dtype, np.floating):
        # create unit-norm random vectors
        values = np.random.standard_normal(shape)
        values /= np.linalg.norm(values)
    else:
        # create random unsigend integers summing to 42 or -42
        n = np.prod(shape)
        values = np.random.multinomial(42, np.ones((n,)) / n, size=(n,))[0].reshape(shape)
        if issubclass(dtype, np.signedinteger):
            values = -values

    # save them to disk
    filename = f"{FOLDER}/{dtype.__name__}-{shape}.npy"
    np.save(filename, values.astype(dtype), allow_pickle=False)
