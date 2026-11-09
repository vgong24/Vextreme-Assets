# Lucidspark Screenshot Preservations

This directory is reserved for source-preservation screenshots manually ported from Lucidspark in their intended sequence order.

## Sequence convention

Use a zero-padded numeric prefix so lexical order is also sequence order:

```text
0001.<ext>
0002.<ext>
0003-optional-short-label.<ext>
...
```

## Evidence-fidelity invariant

Preserved screenshots MUST retain the exact uploaded image bytes.

- No resizing or downscaling.
- No recompression or quality reduction.
- No format conversion.
- No cropping, sharpening, denoising, color adjustment, metadata-driven re-rendering, or other image processing.
- Renaming for sequence order is permitted only when the file bytes remain unchanged.
- SHA-256 before repository carriage MUST equal SHA-256 of the repository file after the write.

Any byte-changing image transformation invalidates the preservation proof for that file and requires recovery from the original uploaded bytes.

This namespace is intentionally separate from:

- `__assets/`, which is the repository's canonical/content-addressed asset store.
- `evidence/screenshots/`, which is derived browser/localization verification evidence.

If a preserved Lucidspark image is later promoted into either contract, do that as a separate explicit adoption step rather than changing the meaning of this preservation sequence.

*[VXG RealForever]*
