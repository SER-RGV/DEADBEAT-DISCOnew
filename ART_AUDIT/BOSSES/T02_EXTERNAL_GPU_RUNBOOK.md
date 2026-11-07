# BOSS-T02 external hardware-GPU validation runbook

**Gate state: BLOCKED — no hardware-GPU comparison has been run.**  
**T02 status remains: INTEGRATED AND VERIFIED, BUT NOT CLOSED.**  
**Do not start BOSS-T03 until the existing gate is reviewed and closed.**

This procedure prepares a reproducible paired comparison of **T01-only boss art records** against **T01 + BOSS-T02 boss art records** on a real, accelerated Windows or Linux Chrome installation. It does not alter game source, assets, gameplay, `artId`, resolver behavior, boss logic, animation, collision, attacks, or controls. Do not treat this runbook's SwiftShader-only precondition smoke as performance evidence.

## 1. Comparison definition and scope

- **T01 configuration (A):** the frozen `ART_PACK/art_pack.js` response with exactly the 10 lines tagged `batch: 'BOSS-T02'` removed in-memory by the harness. All other response lines are preserved byte-for-byte (line endings are fail-closed). The production file is not edited.
- **T02 configuration (B):** the original frozen `ART_PACK/art_pack.js` response, unmodified.
- Both configurations retain the same HTML/gameplay, game/runtime version, T01 records, scene, viewport, scripted controls, browser, GPU, and resource server. The A/B delta is the BOSS-T02 manifest records only. Other non-BOSS architectural Tanda 02 assets already in the common pack remain in both configurations; this is **not** a whole-game “all T02 assets off vs on” test.
- The harness starts through the existing entry-cover API and selects the actual secret-boss encounter with `window.DMO.secretBoss.startEncounter()`. It asserts `window.DMO.combatArt.info().bossId === 'boss_05_fusioncosmica'` in each fresh context. It never uses `DMO_ART_TEST`, fakes an entity, overrides `artId`, or changes the resolver.
- The paired gameplay scene is **Boss05 only**. It measures total BOSS-T02 pack loading/cache footprint plus the Boss05 encounter's hot render path. It does **not** establish that Boss06 or Boss07 T02 frames were rendered, nor benchmark their boss-specific hot draw paths. If the acceptance gate requires hot rendering of Boss06/07 too, stop and record that additional scope as blocked; do not substitute a fake boss or force an ID.

The precondition smoke in `evidence/T02_performance/external_gpu/sandbox_precondition_validation/sandbox_precondition_check.json` passed for both configs: A had 10 T01 / 0 T02 records and all 18 loaded pack assets live; B had 10 T01 / 10 T02 records and all 28 live; both scenes resolved to the stable Boss05 ID. It used SwiftShader and collected no timed frame samples or GPU performance metrics. It validates the harness mechanics, **not** hardware performance.

## 2. Host and browser prerequisites

Run on a physical Windows or Linux machine with a supported NVIDIA, AMD, or Intel GPU and a current stable Chrome installation. Use the same host/browser/GPU for both configurations.

1. Install/update the vendor's stable GPU driver and reboot if required.
2. Use local desktop Chrome with hardware acceleration enabled. Avoid a VM, software/remote virtual display, browser headless mode, or an RDP/remote-desktop session unless the hardware path is independently verified as accelerated.
3. Do not launch with `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, `--disable-gpu`, `--disable-software-rasterizer`, or `--headless`. Do not add flags to force a result. The harness verifies WebGL renderer identity **and** Chrome GPU diagnostics and refuses to collect timed passes unless both support hardware acceleration.
4. Keep Chrome on the foreground desktop; do not minimize it or cover it with a full-screen workload. Close GPU-intensive applications, keep the machine on AC power and a stable performance/power profile, and avoid driver/browser updates between configurations.
5. Use the repository snapshot matching `external_gpu/source_hashes.json`. The harness checks 52 SHA-256 values covering the HTML, pack, both boss manifests, this runbook, the harness, and all 46 runtime images referenced by the pack; it aborts on any mismatch. Do not refresh the contract automatically; review any source change first.
6. Install Node.js LTS and `playwright-core` on the external machine. From the repository root:

   ```sh
   npm install --no-save playwright-core
   ```

   This is only a local validation dependency; do not commit dependency artifacts for this evidence task. Install Chrome separately through the normal OS/vendor installer.

## 3. Preflight first; do not benchmark if it fails

From the repository root, create a **new, empty** run folder for each invocation. The folder must be inside `ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/`.

Linux example:

```sh
node ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/benchmark_external_gpu.js \
  --preflight-only \
  --out ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/runs/linux_gpu_preflight_01
```

Windows PowerShell example (use the actual installed Chrome path if automatic channel discovery fails):

```powershell
node ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/benchmark_external_gpu.js `
  --preflight-only `
  --chrome-path "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --out "ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/runs/windows_gpu_preflight_01"
```

Review `gpu_diagnostics.json` and `environment.json` in the preflight output. Require all of the following:

- WebGL exposes a concrete, non-software renderer (not SwiftShader, llvmpipe, softpipe, or another software renderer).
- Chrome `SystemInfo.getInfo` identifies a non-software physical adapter.
- Chrome `chrome://gpu` / feature status reports an enabled hardware-accelerated WebGL or compositing feature.
- Browser is visible, hardware acceleration is active, and the source hashes match.

If the script exits with the blocked status (exit code 2), stop. It writes explicit `NOT_RUN` files and starts no game scene or timing pass. Do not “fix” the check by forcing GPU flags. A successful preflight collects no benchmark data; use a different new output directory for the full matrix.

## 4. Full paired matrix

Linux:

```sh
node ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/benchmark_external_gpu.js \
  --out ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/runs/linux_gpu_run_01
```

Windows PowerShell:

```powershell
node ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/benchmark_external_gpu.js `
  --chrome-path "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --out "ART_AUDIT/BOSSES/evidence/T02_performance/external_gpu/runs/windows_gpu_run_01"
```

The harness automatically runs five paired repetitions in this alternating order:

| Pair | First | Second |
|---|---|---|
| 1 | T01 | T02 |
| 2 | T02 | T01 |
| 3 | T01 | T02 |
| 4 | T02 | T01 |
| 5 | T01 | T02 |

Each pass uses a fresh isolated browser context, fixed CSS viewport **1440 × 1000**, device scale factor **1**, a **15 s warmup**, then a **60 s requestAnimationFrame interval capture**. The same repeatable ordinary input sequence is applied during warmup and capture: hold Up, Right, Down, Left in order, up to 1150 ms each, with 100 ms neutral gaps; no firing, test hooks, or gameplay-state edits. Scene launch uses the ordinary entry gate/start flow followed by the built-in Boss05 encounter API. Do not interact with the game during the measurement window.

The order reduces monotonic order bias; it does not eliminate thermal or game-RNG variance. Keep all five pairs, including outliers. Do not silently restart, remove, or replace a slow pass; mark it invalid with the reason and rerun the **entire paired matrix** in a fresh directory if required.

Two additional **diagnostic-only** Chrome tracing profiles (one per config) are captured after the timed matrix. They are not included in the primary frame-time sample. Total wall time is approximately 13–15 minutes plus startup and file writing.

## 5. What the harness measures and what it does not

- `rawFrameTimesMs` are browser `requestAnimationFrame` intervals, not a GPU timestamp query. The harness records per-pass frame count, mean, median, P95, P99, maximum, and reciprocal-of-mean FPS estimate.
- Resource Timing, image load events, and image readiness are recorded by configuration. The `Image.decode()` confirmation is called after load/readiness; its wall time is a **post-load confirmation**, not initial decode cost.
- JavaScript heap before/after is not VRAM. Chrome does not reliably expose GPU memory here; VRAM is explicitly left unmeasured rather than inferred.
- The separate trace summarizes main-thread JavaScript task duration and compositor/raster/GPU events. Categories may overlap. Main-thread JavaScript contains gameplay logic **and** Canvas draw-command submission, so these profiles do not exactly isolate game logic from rendering. Do not sum overlapping trace categories as an exclusive cost breakdown.
- The existing HTML notes a removed hosting-injected Cloudflare challenge loader. The only known non-game response tolerated by the harness is its exact `/cdn-cgi/challenge-platform/scripts/jsd/main.js` 404 path; it is retained in the raw error/response log. Any other page error, unexpected console error, missing local app/resource response, inactive Boss05 scene, hidden tab, or insufficient frame sample invalidates that pass.

## 6. Output files and analysis

Each run directory contains:

- `source_hashes_used.json` — source verification plus exact response-filter IDs and hashes.
- `gpu_diagnostics.json`, `environment.json`, `gate_status.json` — GPU proof, host/browser context, and gate state.
- `runs_T01.json`, `runs_T02.json` — full per-pass data, raw frame intervals, scene/pack assertions, resources, controls, errors, heap observations, and screenshot paths.
- `raw_metrics.json` — raw frame-interval arrays indexed by run/config/pair.
- `comparison.json` — per-run summaries, paired deltas/percent changes, retained outlier flags, and an explicit sufficiency status. It never declares a regression or closes the gate automatically.
- `screenshots/` — first-pair scene captures for each config; these are performance-run screenshots, unlike the earlier visual QA captures.
- `traces/` — diagnostic-only Chrome trace JSON for both configs.
- `performance_charts/` — paired frame-time charts only if at least five valid passes and five complete pairs exist. Partial samples do not receive a comparison chart.

Require **five valid hardware passes per config and five complete pairs** before quantitative review. Compare paired means and P95/P99, per-run spread (IQR/range), and all outliers; check that the scene, pack delta, resource set, error status, and host/browser/GPU stayed consistent. There is no performance regression threshold defined in this runbook. Apply only an already-approved project threshold; do not invent one after seeing the results. If no threshold/policy exists, record the measurements and leave the acceptance decision unresolved.

Do not claim “no regression” from fewer than five valid pairs, from overlapping variance alone, or from a zero-error run. Do not compare historical SwiftShader results with this real-GPU matrix.

## 7. Reproducibility and status updates

Preserve the entire run directory unedited. Include the host label, test date/time and timezone, Chrome version, OS/driver version, GPU model, source revision/hash, display/session type, power profile, and any invalidated runs in the final review. Keep a copy of the full repository snapshot or a reproducible commit/archive with the evidence.

After the run, manually review the raw JSON, screenshots and traces. Update `evidence/T02_performance/PERFORMANCE_GATE_REPORT.md` and `BOSS-T02_REPORT.md` only after complete valid data and gate review. Do not change frozen T01/T02 integration/visual approvals, do not close T02 just because the harness completed, and do not begin BOSS-T03 until the gate owner explicitly closes T02.

## 8. SwiftShader-only validation is not a performance run

The committed `sandbox_precondition_validation/sandbox_precondition_check.json` records a successful software-rendered check of the two configurations and real Boss05 identity. It contains no elapsed frame samples, GPU metrics, or performance comparison and is not hardware evidence. Never use `--validate-scene-only` or any headless/SwiftShader run to produce acceptance numbers.
