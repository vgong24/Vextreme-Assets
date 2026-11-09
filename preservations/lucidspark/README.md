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

Preserve the original screenshot/export bytes where practical; renaming for sequence order should not require re-encoding.

This namespace is intentionally separate from:

- `__assets/`, which is the repository's canonical/content-addressed asset store.
- `evidence/screenshots/`, which is derived browser/localization verification evidence.

If a preserved Lucidspark image is later promoted into either contract, do that as a separate explicit adoption step rather than changing the meaning of this preservation sequence.

*[VXG RealForever]*
