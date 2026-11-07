# B4.2 Post-R1 Test Report

**Date:** 2026-11-04
**Branch / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9` (unchanged; no commit)
**Result:** Required regression suites pass and the ten-profile combat matrix passes. **One reproducible B2 sweep recovery-event finding is recorded as B2-LC-01; no fix or production modification was made.**

## 1. Required regression matrix

| Suite | Execution | Result | Notes / evidence |
|---|---|---|---|
| B1 `zones.max` | `node ART_TOOLS/qa/test_boss_zone_max_b1.js` | **PASS** (exit 0) | All original/additional checks in `regression_b1.json` report PASS, including configured maxima, global caps, independent types/owners, reset/purge, and serializer checks. No B1 source or `zones.max` change. |
| B2 FSM | `node ART_TOOLS/qa/test_boss_animation_fsm_b2.js` | **PASS, 60/60** | `regression_b2_60.json`. The live sweep/recovery-event asymmetry found in B4.2 is not an assertion in this suite; see audit §6. |
| B3 deterministic telegraph contract | Temporary output-redirected copy of `test_boss_telegraph_b3.js`; logic unchanged | **PASS, 156/156** | 42/42 links correct, 0 partial/missing. Output saved as `b3_deterministic_rerun.json`; existing B3 evidence was not overwritten. |
| Canonical B3 Chromium behavior | Output-redirected diagnostic copy of `test_boss_telegraph_browser_b3.js`; gameplay steps/assertions unchanged; no added conditional Escape/resume workaround and no manual input | **PASS** this rerun | HTTP 200; real `burst`/`spiral` telegraphs, sweep cancellation at volley/berserk, final FSM `ENRAGED`; 0 page errors, 0 local failures, two ignored `/cdn-cgi/` 404s. Evidence: `b3_browser_canonical/sweep_phase_cancellation.json`, captures and `runner_trace.log`. The repository’s canonical runner stayed unchanged. |
| BOSS-T01 | Sequential temporary output-redirected copy of `validate_boss_tanda_01.js` | **PASS, 17/17** | Run alone, not parallel with other Chromium captures; 0 page errors and 0 failed responses. `t01_regression/qa_report.json`. |
| BOSS-T02 | Temporary output-redirected copy of `validate_boss_tanda_02.js`, run after T01 completed | **PASS, 16/16** | 0 page errors and 0 bad local responses. `t02_regression/qa_report.json`. |
| B4 ten-profile Chromium | Temporary instrumented B4 runtime runner against active HTML | **PASS, 10/10** | 320 × 0.05s = 16s/profile; selected patterns, R1 counters, scheduler slots, B2 events and captures recorded; 0 page errors, 0 local failures, 20 ignored environment `/cdn-cgi/` 404s. `scenario_matrix.json` and ten profile JPGs. |
| B4.1-R1 source-coupled suite | `node ART_TOOLS/qa/test_boss_combat_behavior_b4_1_r1.js` | **PASS, 34/34** | `regression_r1_34.json`; source-coupled rejection/partial/full/cancellation/reset checks. |
| B4.2 profile R1 cases | Saved `controlled_profile_audit.js` | **PASS** | 10/10 total-reject, partial and full cases; 10/10 zero-attempt cancellations; 10/10 two-attack and 10/10 three-attack sequences; 10/10 clean resets. JSON saved. |
| B4.2 controlled saturation | Saved `saturation_audit.js` | **PASS** | 10/10 profiles hold the 34-count synthetic gate for 10s without selection; selection resumes at 3.70s after synthetic release/expiry. Not a live gameplay stress test. |
| Live R1 rejection/recovery | `r1_live_rejection_audit.js` Chromium probe | **PASS** | Actual Pogo fan: 5/0/0, no hostile bullets or false attack lifecycle; next pattern selected at 2.25s with counters reset. 0 page errors/local failures; two ignored external 404s. |

The B3 deterministic, B3 Chromium, T01 and T02 output paths were isolated under the new `B4_2_post_R1` evidence directory to preserve existing evidence. Only path/output redirection and (for the B3 Chromium clone) diagnostic logging differed; the B3 gameplay input/assertion body was unchanged. No canonical QA runner was edited.

### Canonical B3 pause-sensitive history

The prior B4.1 report recorded a canonical B3 startup run that remained paused and failed the `burst` selection assertion. This post-R1 rerun exercised the same canonical gameplay steps without manual intervention and passed; the temporary copy only redirected output and added trace logging. The pause failure was **not reproduced in this rerun**, so it is recorded as intermittent/flaky rather than “fixed.” The canonical file hash below is unchanged. No conditional resume workaround was inserted.

## 2. Audit totals and B2 finding

The active B4 Chromium sample selected 40 pattern runs: 35 normal completions, four still active at the 16-second horizon, and one phase interruption. R1 projectile totals were 372 attempted / 372 accepted / 372 created; scheduler slots were 424. Three zero-attempt selections and the one still-progressing Núcleo spiral are explicitly horizon-censored, not failures. Full per-attack data is in `B4_2_POST_R1_AUDIT.md` and `scenario_matrix.json`.

Attack-start/terminal reconciliation found 41 starts, 39 normal `attack.end`, one `attack.interrupted`, and one open Núcleo attack at the sample horizon; there are zero duplicate/unpaired attack starts/terminals and zero overlapping B2 attack intervals. Completed pattern runs emit their normal `recovery.start` signals. B2-LC-01 is a separate sweep event-shape finding: in four live sweepers the preceding pattern’s `recovery.end` is mislabeled `sweep`, and each normal sweep tail lacks `recovery.start` although the FSM enters `ATTACK_RECOVERY` and emits the later tail `recovery.end`. The exact event times, source mechanism and classification are recorded in `b2_lifecycle_reconciliation.json` and the audit. No code was changed.

## 3. Source and runner hashes

| File | SHA-256 |
|---|---|
| `DEADBEAT_DISCO.ART.html` (post-R1 active baseline) | `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a` |
| `boss_animation_state_machine.js` (post-R1 active baseline) | `fdb726ef7d0116cd0ce38c14702b53ca9741b7c977e880156002ba7c410117ed` |
| `ART_TOOLS/qa/test_boss_zone_max_b1.js` | `4eff5e6d236e3493901e568c8ff189811651f8adb3ea27c0c754aa50a3e488e4` |
| `ART_TOOLS/qa/test_boss_animation_fsm_b2.js` | `3342ffa36615b51c5847e3933666663c0a6338ea95eb7943bc13c0b441bbd63c` |
| `ART_TOOLS/qa/test_boss_telegraph_b3.js` | `768e00f74341d4b1aa177dda282c4386e854155feac032f908c6ea5db624978b` |
| `ART_TOOLS/qa/test_boss_telegraph_browser_b3.js` (canonical, unchanged) | `96f669fdc8dde9bd995611f512fa0d689d5fd57e2885ebb7c99d2dd20f11b42e` |
| `ART_TOOLS/qa/test_boss_combat_behavior_b4.js` | `a0e1ce4bcf47d3e22191d87674b2a72fb9f99f46ec2db0c93de0f08d9718ee28` |
| `ART_TOOLS/qa/test_boss_combat_behavior_b4_1_r1.js` | `d3c31b0fa55404230eefaebfbc9446766706065f3aab4fa34b70f5dbf80aed68` |
| `ART_TOOLS/qa/validate_boss_tanda_01.js` | `c5ca66aa7d9132ddf7247303190bf56bccee3d4a4391d91b11ab109038a51020` |
| `ART_TOOLS/qa/validate_boss_tanda_02.js` | `955ac99f3a2430f95bfd517069fe18ecbeda309baadc8527db1de7e1aaad78ae` |

These active HTML/FSM hashes match the R1 correction reference (`B4_1_R1_CORRECTION_REPORT.md`), not the pre-R1 B4 hashes. Full source hashes are recorded in `evidence/B4_2_post_R1/source_hashes.json`; the evidence-directory `SHA256SUMS.txt` covers the persisted JSON, runners, and captures.

## 4. Execution environment and limitations

- Chromium ran against the existing local static servers at ports 4173/4176. External QA dependencies remained outside the repository.
- The B4 ten-profile run is scripted, with injected positions and seeded randomness; its sample is not a full human match, gameplay stress test, or performance benchmark.
- The controlled 34-projectile saturation test uses synthetic `Ia` load/lifetime, not browser-created bullets. The multi-attack tests use existing patterns and clear synthetic bullets between completed attacks.
- Human fun, fairness, balance, readability and accessibility remain **unverified**.
- R2/R3 classifications remain unchanged. No B5/B6/BOSS-T03 work was started.
- `HEAD` and branch remained unchanged. No commit, push, merge, branch change, or main/origin operation occurred. Existing unrelated uncommitted work and evidence were preserved.
- `git diff --check` and a final production-source hash comparison are recorded in the completion report; no production/runtime or canonical B3 runner file was modified by B4.2.

## 5. Persisted evidence

All B4.2 artifacts are under `ART_AUDIT/BOSSES/evidence/B4_2_post_R1/`. Key files:

- `scenario_matrix.json`, `captures/*.jpg` — live ten-profile Chromium sample.
- `controlled_r1_profiles.json`, `saturation_matrix.json`, `b2_lifecycle_reconciliation.json` — controlled R1, saturation and B2 audit outputs.
- `r1_browser_rejection.json`, `captures/r1_total_rejection.jpg` — active-game R1 rejection/recovery probe.
- `b3_deterministic_rerun.json`, `b3_browser_canonical/` — B3 reruns with isolated output.
- `t01_regression/qa_report.json`, `t02_regression/qa_report.json` — sequential T01 and T02 browser reports.
- `regression_b1.json`, `regression_b2_60.json`, `regression_r1_34.json`; reproducible source-coupled runners; `source_hashes.json`; `SHA256SUMS.txt`.

**Stop condition:** B4.2 validation is complete and B2-LC-01 is reproducible. No code changes or phase advancement should occur without explicit authorization.

## 6. Workspace integrity and completion checks

- Active HTML/FSM hashes match the R1 correction baseline; canonical B3 Chromium and other repository QA runner hashes match the measured values above. No B4.2 production/runtime code or canonical test runner was modified.
- `git diff --check`: PASS. The working branch and HEAD are unchanged. The worktree already contained unrelated uncommitted changes; they were preserved. No existing evidence was moved, deleted, or overwritten; browser/test outputs were redirected to new B4.2 evidence paths.
- Evidence checksum manifest: `evidence/B4_2_post_R1/SHA256SUMS.txt`; SHA-256 `f2ad544095a68dc56f806308bad3a616d0c208ba81f929388115bdf440b72516` (64 evidence files).
- The requested reports are `ART_AUDIT/BOSSES/B4_2_POST_R1_AUDIT.md` and `ART_AUDIT/BOSSES/B4_2_POST_R1_TEST_REPORT.md`. B4.2 stops at B2-LC-01; no phase advancement or fix is authorized by these results.
