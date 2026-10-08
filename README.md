# Vextreme Assets

Public static-asset store for [Vextreme](https://github.com/vgong24/Vextreme).

## Canonical contract

```text
__assets/<64-hex-id>.<extension>
```

The initial human upload arrived in temporary type/batch folders. This repository normalizes those paths without re-encoding or re-uploading the binary payloads: the canonical files point at the same Git blob objects.

The original batch layout remains recoverable in Git history at `cd2b60424c4bb4419a85009160e60d50dc574f11`. `asset-manifest.json` records each canonical path, original import path, Git blob SHA, extension, and byte size.

Vextreme may change the public asset **origin**, but the content-style asset filename should remain stable.

## Audit

```bash
node scripts/audit-vextreme-assets.mjs --vextreme ../Vextreme --json asset-audit-report.json
```

The audit maps every retained `/__assets/...` reference it can find in Vextreme against this store and follows text-asset dependencies such as CSS. It does not need to decode images to do the mapping.

Use `--verify-hashes` only when byte-level SHA-256 verification is wanted for the referenced subset.

*[VXG RealForever]*
