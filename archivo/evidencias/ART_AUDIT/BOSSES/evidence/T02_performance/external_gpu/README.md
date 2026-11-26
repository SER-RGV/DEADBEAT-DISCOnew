# External GPU evidence directory

**Current state: BLOCKED — no external hardware-GPU run has been performed.** The existing T02 gate remains open.

- Runbook: [`ART_AUDIT/BOSSES/T02_EXTERNAL_GPU_RUNBOOK.md`](../../../T02_EXTERNAL_GPU_RUNBOOK.md)
- Current blocked summary: [`EXTERNAL_GPU_VALIDATION_REPORT.md`](../../../EXTERNAL_GPU_VALIDATION_REPORT.md)
- Frozen source-hash contract: `source_hashes.json`
- Harness: `benchmark_external_gpu.js`
- Honest no-run artifacts: `environment.json`, `gpu_diagnostics.json`, `gate_status.json`, `runs_T01.json`, `runs_T02.json`, `raw_metrics.json`, `comparison.json`
- Non-performance scene/filter precondition smoke: `sandbox_precondition_validation/sandbox_precondition_check.json` — SwiftShader; not GPU evidence.

For a real test, follow the runbook on an accelerated Windows/Linux host. Every invocation must use a new empty output directory under this directory. Do not fill these templates with estimates or copy SwiftShader measurements into a real-GPU run.
