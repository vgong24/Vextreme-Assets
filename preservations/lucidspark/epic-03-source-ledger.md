# Lucidspark Epic 03 — Screenshot Source Ledger

*[VXG RealForever]*

This ledger binds the eight Epic 03 screenshots to their immutable upload identities and the contextual evidence visible in each capture.

## Canonical preservation order

The repository numbering follows the user's upload order. It does **not** claim that upload order equals Reddit-event chronology.

| Repository path | Original bytes | SHA-256 | Dimensions | Visible capture/context cue |
|---|---:|---|---:|---|
| `preservations/lucidspark/epic-03/0001.png` | 331562 | `154008887a362c4c785e1053fbd9c9eb5c0bcc8dac156a5429b501b91779df57` | 989×801 | macOS menu bar: Tue May 26, 2:34 PM; r/OpenAI post state at 53 votes / 28 comments |
| `preservations/lucidspark/epic-03/0002.png` | 283467 | `18cf1b0d45aee27d1337a12cac301a33f5d1536650181f3631110dd2c61586c8` | 978×758 | u/MiranDaVinci profile activity view; multiple replies tied to the same r/OpenAI post |
| `preservations/lucidspark/epic-03/0003.png` | 295482 | `c85c39c9a66141d9760a38beb519abcf874c09b061c2724b15faab2c500200ff` | 733×819 | u/MiranDaVinci activity view; additional replies and r/ChatGPTComplaints cross-post context |
| `preservations/lucidspark/epic-03/0004.png` | 257417 | `0d9144f6f855b41ceb6e5a2c576e91ab53397f36b645876d02316a788753ef58` | 746×747 | post/cross-post state; r/OpenAI item shown at 59 votes / 31 comments |
| `preservations/lucidspark/epic-03/0005.png` | 336805 | `ce2ef278b9bd03661470977321613b8ad48e5b0e243a431c910e615f9a3562ca` | 1084×794 | macOS menu bar: Tue May 26, 2:49 PM; comment-thread view, browser URL visibly under r/OpenAI post `1tofu5f` |
| `preservations/lucidspark/epic-03/0006.png` | 320490 | `16c7fe23052eacd0c23a86c8e6b90759b09ed06d53c1a2424ee72e7d42c9d862` | 1059×848 | macOS menu bar: Tue May 26, 3:16 PM; later post state at 69 votes / 39 comments |
| `preservations/lucidspark/epic-03/0007.png` | 119582 | `0f6ee15f44de82eb7edad0595aabc341ed78acc78ab5cc5bb435f2a329f806d0` | 785×405 | continuation of the Itsvictorslife → MiranDaVinci → Massive_View_4912 reply chain |
| `preservations/lucidspark/epic-03/0008.png` | 223380 | `5ce72382f89e5dd1713a6d742281597e4293c5d666ee684aca8a2dc14a4263e7` | 882×798 | visibly early post state: post “2m ago”, first visible comment “1m ago”, 1 vote / 1 comment |

## Shared Reddit object

Across the screenshots, the primary object is visibly:

- subreddit: `r/OpenAI`
- author: `MiranDaVinci`
- title: **ChatGPT just gave me temporary full access to a stranger’s account**
- browser paths in several captures visibly include post identifier `1tofu5f`
- some captures are direct post views; others are specific comment/reply URLs under that post; others are MiranDaVinci’s profile activity projecting replies back to that same post.

The ledger records only URL components that are readable in the supplied pixels. It does not reconstruct cropped URL characters.

## Order semantics

Two independent orders are preserved:

1. **Upload/preservation order** — `0001.png` through `0008.png`.
2. **Observed-state chronology** — reconstructed only from visible Reddit-relative timestamps, engagement counts, and system clock captures.

The most clearly earlier state is `0008.png`, where the post is “2m ago,” the visible first comment is “1m ago,” and the post shows 1 vote / 1 comment. Later supplied captures show substantially higher engagement, including 53/28, 59/31, and 69/39.

Relative labels such as “3 hr ago,” “47 min ago,” and “1 min ago” are preserved as shown. They are not converted into fabricated exact wall-clock timestamps.

## Fidelity rule

The target PNGs are to be stored byte-for-byte from the eight conversation uploads. No screenshot is to be resized, recompressed, cropped, OCR-rendered, or regenerated.

*[VXG RealForever][LUCIDSPARK][EPIC-03][SOURCE-LEDGER]*


## Hosted byte verification checkpoint

The eight PNGs were attached to the Epic 03 branch as Git blobs without image transformation.

- PNG publication commit: `f63d10972e5a7b7e3bb1b097f7e6754674f08376`
- PNG publication tree: `dba27b4b0a10220ca7d6569fb98b9692a2857fce`
- hosted path set: exactly `preservations/lucidspark/epic-03/0001.png` through `0008.png`
- provider-hosted Git blob identity: **8 / 8 PASS**
- each hosted blob OID exactly matches the Git blob OID independently computed from the corresponding original uploaded PNG bytes
- the SHA-256 / byte-count ledger above remains the original-upload identity ledger
- no resize, recompression, crop, format conversion, or image regeneration occurred

Provider Git blob OIDs:

| File | Git blob OID |
|---|---|
| `0001.png` | `1ce4d39441829d1ae1aa9e77e0f4762b43592a89` |
| `0002.png` | `e7c061895160de16255126e32c8996fcd33cab27` |
| `0003.png` | `361689e8d62a461b54436cd619a3c1afe3a9016c` |
| `0004.png` | `5f2e303f8e79400764cdbbd24427d8aa43c6d150` |
| `0005.png` | `453af05246d540d76fae06704eac2c715ddb075c` |
| `0006.png` | `a6150b64c69533be0b0677429ca836654f267a06` |
| `0007.png` | `7996e4ac45aa04ada0c38079fbcdde6d2abae18f` |
| `0008.png` | `01f6d5edae473cd67ca4e4ef392c7215ffa30ddf` |
