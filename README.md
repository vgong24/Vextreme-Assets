# Vextreme Assets

Public static-asset store for [Vextreme](https://github.com/vgong24/Vextreme).

## Canonical contract

```text
__assets/<64-hex-id>.<extension>
```

The initial human upload arrived in temporary type/batch folders. This repository normalizes those paths without re-encoding or re-uploading the binary payloads: the canonical files point at the same Git blob objects.

The original batch layout remains recoverable in Git history at `cd2b60424c4bb4419a85009160e60d50dc574f11`. `asset-manifest.json` records each canonical path, original import path, Git blob SHA, extension, and byte size.

Vextreme may change the public asset **origin**, but the content-style asset filename should remain stable.

## Derived screenshot evidence

`__assets/` is reserved for preserved source/import dependencies. Browser screenshots are generated verification evidence and intentionally use a separate namespace:

```text
evidence/screenshots/<namespace>/<slug>/<locale>/<theme>/<viewport>/<sha256>.png
evidence/screenshots/manifest.json
```

The semantic path answers what the capture represents; the final SHA-256 filename preserves immutable byte identity. The manifest binds each current semantic coordinate to the exact source repository, source commit, source page, and capture kind. Re-capturing the same coordinate replaces only the current-tree pointer/file; Git history retains the prior evidence.

This separation is deliberate:

```text
__assets/              = preserved authored/source dependencies
evidence/screenshots/  = derived browser/localization evidence
```

Ingest or validate screenshot evidence with:

```bash
node scripts/ingest-screenshot-evidence.mjs \
  --file /path/to/capture.png \
  --namespace vextreme \
  --slug claude-answers-the-doubt \
  --locale ja \
  --theme default \
  --viewport 1280 \
  --source-repo vgong24/Vextreme \
  --source-commit <40-hex-commit>

node scripts/ingest-screenshot-evidence.mjs --check
```

The ingest tool copies PNG bytes unchanged, computes SHA-256, refuses non-PNG or unsafe coordinates, and validates that every current evidence PNG is manifest-owned.

## Pages delivery projection

The canonical repository keeps imported asset bytes unchanged. GitHub project Pages serves this repository below `/Vextreme-Assets/`, while some preserved CSS contains provider-root references such as `url("/__assets/<id>.ttf")`.

The Pages workflow therefore copies the repository into a disposable staging tree and rewrites **staged CSS only** from `/__assets/<id>` to same-directory `./<id>` before upload. Canonical Git blobs remain untouched; images, fonts, and other binary assets remain byte-identical. The post-deploy smoke check compares the served projection against the staging tree and verifies a nested font plus representative public images.

This is a serving adapter, not a change to imported source identity.

## Audit

```bash
node scripts/audit-vextreme-assets.mjs --vextreme ../Vextreme --json asset-audit-report.json
```

The audit maps every retained `/__assets/...` reference it can find in Vextreme against this store and follows text-asset dependencies such as CSS. It does not need to decode images to do the mapping.

Use `--verify-hashes` only when byte-level SHA-256 verification is wanted for the referenced subset.

*[VXG RealForever]*
