# BOSS-T02 external GPU validation — current status

**Result: BLOCKED — no hardware-GPU comparison has been performed.**  
**T02 remains INTEGRATED AND VERIFIED, BUT NOT CLOSED.**  
**Do not begin BOSS-T03.**

## Prepared

- `T02_EXTERNAL_GPU_RUNBOOK.md` documents a Windows/Linux real-GPU preflight, source-hash guard, paired T01 vs. T01+BOSS-T02 matrix (five passes each, alternating order), fixed Boss05 encounter and controls, metrics, diagnostics, trace caveats, analysis, and reproducibility.
- `evidence/T02_performance/external_gpu/benchmark_external_gpu.js` is a fail-closed external harness. For T01 it filters only the ten `BOSS-T02` records in the served `ART_PACK` response; it does not edit repository source or assets.
- `evidence/T02_performance/external_gpu/source_hashes.json` locks the reviewed HTML, loader, manifests, and boss-art snapshot.
- `evidence/T02_performance/external_gpu/sandbox_precondition_validation/sandbox_precondition_check.json` confirms the exact T01/T02 record delta and that both fresh contexts reach the real stable Boss05 ID. This used SwiftShader for scene/loader precondition validation only; it contains no frame-time series, GPU-performance sample, or performance comparison.
- Honest no-run templates in `evidence/T02_performance/external_gpu/` record zero valid external passes and no metrics.

## Why blocked

The only available environment is a virtualized KVM sandbox with no `/dev/dri` GPU device. Its Chromium 153.0.8010.0 reports the SwiftShader software renderer and was launched with explicit SwiftShader flags. These conditions do not satisfy the hardware gate. Prior SwiftShader runs remain diagnostic and non-comparable; they were not copied into the external templates.

## Comparison scope

Both configurations exercise the real secret encounter `boss_05_fusioncosmica`. B loads all 10 BOSS-T02 records; A excludes exactly those records in memory while keeping the rest of the pack and runtime unchanged. This tests total T02 package loading/cache impact and Boss05 hot rendering. It does not prove Boss06 or Boss07 T02 frames were rendered or measure their boss-specific hot draw paths.

## Next action

Run the preflight, then the full matrix, on an accelerated external Windows/Linux GPU machine using the runbook. Keep all raw artifacts. The harness does not make an automatic regression or closure decision; the gate owner must review complete paired data under an already-approved project threshold.
