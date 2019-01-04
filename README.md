# numpy-parser
A JS parser for (binary) `.npy` files, supporting all TypedArray subclasses:

* float32 & float64
* int8, int16, int32
* uint8, uint16, uint32

## Acknowledgements

This implementation was inspired by [this gist by nvictus](https://gist.github.com/nvictus/88b3b5bfe587d32ac1ab519fd0009607).

## Future Work

`.npy` files can encode floats as 16 bit long, too. While JS runtimes may not support this as a native data type, we could still consider supporting it and parsing into 32 bit floats to at least get the bandwidth savings in transit.
