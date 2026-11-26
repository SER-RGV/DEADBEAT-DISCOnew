# B4.1-R1 — Test Report

**Date:** 2026-11-04
**Branch / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9` (no commit)
**R1 test:** `ART_TOOLS/qa/test_boss_combat_behavior_b4_1_r1.js`
**Original B2 assertion baseline SHA-256:** `b2f24c4da5db2b85ba3e9ddcd3ed4cb66de84dfe51be121f978b3e80e611dda4`
**B4 browser matrix:** 10 residents; deterministic QA paths, not a human playtest.

## R1 regressions

The new VM/source-coupled suite extracts the actual active HTML implementations of `vh()`, `wh()`, `Th()`, and the `Th()` B2 observer, and loads the actual `boss_animation_state_machine.js`. Only geometry/acceptance and projectile-budget dependencies are controlled. Pattern definitions, `vh()` effects, scheduler cadence, observer, and FSM are production source.

| Case | Attempts | Accepted | Created | B2 result |
|---|---:|---:|---:|---|
| All five rejected by `vh()` | 5 | 0 | 0 | No false attack or recovery lifecycle; scheduler still completes and clears the pattern |
| Partial fan acceptance | 5 | 2 | 2 | One start and one normally completed end with exact counts; normal recovery retained |
| Full fan acceptance | 5 | 5 | 5 | One start/end and the existing single recovery signal |
| Ring corridor removed before emission | 0 | 0 | 0 | Cancellation clears the warning without an attack lifecycle |
| Recovery after rejection | — | — | — | Scheduler selects again within the existing timer; `wh()` resets all counters |
| Fresh encounter | — | — | — | No stale B2 emission/cancellation event remains |

**Result: PASS, 34/34 assertions.** `patternCreated71` measures the actual `Ia` length delta independently of the `vh()` return; the suite verifies both. In the current synchronous path accepted and created coincide because `vh()` returns true only after `Ia.push(...)` and dodge tracking.

**Regression-first check:** against `/tmp/b41_r1_baseline/` (the saved pre-R1 HTML/FSM), the new R1 suite exits nonzero at “five rejected `vh` calls remain 5 attempted / 0 accepted / 0 created.” The extended B2 suite also exits nonzero on the missing partial-emission counts. Against the corrected files the R1 suite passes 34/34 and B2 passes 60/60.

## Required regression matrix

| Suite | Final result | Notes |
|---|---|---|
| B1 zone maximum | **PASS** | All 13 expanded source-coupled additional checks pass; prior behavior and global/type limits retained. B1 production code was not modified. |
| B2 original baseline | **PASS, 51/51** | The saved original B2 test was run unchanged against the corrected FSM/HTML. |
| B2 extended | **PASS, 60/60** | Preserves the original 51 assertions and adds nine R1 assertions for counts, rejection/partial handling, cancellation, and reset. |
| B3 deterministic | **PASS, 156/156** | 42/42 source links correct; zero partial or missing links. Only source assertions were aligned to the R1 observer contract; renderer/telegraph code was not changed. |
| B3 Chromium | **Pause-sensitive; temporary rerun PASS** | A canonical run passed once; a subsequent canonical run remained paused and failed before selecting `burst`. The clearly identified temporary copy `/tmp/b41_test_b3_browser.js` conditionally sends Escape only when `REANUDAR` is present and writes evidence under `/tmp/b41_b3`; it passed the real burst/spiral telegraphs and sweep/phase-cancellation checks. The canonical test file was not edited for this workaround. |
| BOSS-T01 | **PASS, 17/17** | Sequential final rerun passed all checks, with zero page exceptions and zero failed local responses. A first parallel run had one transient idle-frame capture mismatch under concurrent Chromium load; the sequential rerun passed. |
| BOSS-T02 | **PASS, 16/16** | Final run passed all checks, including live state dispatch and attack/hit/death image draws; zero page exceptions and zero failed local responses. |
| B4 Chromium behavior matrix | **PASS, 10/10 residents** | Final active-HTML run passed all ten residents using the pause-safe temporary runner `/tmp/b41_test_b4.js`; no page exceptions or local-resource failures. This is scripted behavior evidence, not fairness validation. |
| B4.1-R1 Chromium rejection probe | **PASS** | Real Pogo selector/`Th()` fan: 5 attempts, 0 accepted, 0 created, 0 hostile projectiles; no false B2 attack lifecycle; recovered to the next pattern with counters reset. |

The T01/T02 and B4 temporary runners redirected generated evidence to `/tmp`; their canonical repository QA scripts were not edited for this run. The temporary B3 workaround changes only the pause check and output path. The B4.1 browser probe was also a temporary QA script; its acceptance cases are reproducibly covered in the repository's R1 source-coupled regression file.

## Syntax, page, and workspace checks

- JavaScript syntax: **PASS** for all **10 executable inline JavaScript blocks** in the active HTML and nine runtime/QA files (`boss_animation_state_machine.js`, B1/B2/B3/B3-browser/B4/R1 tests, and T01/T02 validators). The two non-executable script blocks (`text/plain` font license and `application/json` manifest) were correctly excluded.
- Active HTML load: HTTP **200** in Chromium runs.
- Page errors: **0** in final B3 temporary, T01, T02, B4, and R1 browser runs.
- Local failed resources: **0** in those runs. The B3/B4/R1 consoles showed two environment `/cdn-cgi/challenge-platform/` 404s, excluded from local-resource failures.
- `git diff --check`: **PASS**.
- Branch remained `arena/179474d9-deadbeat-disconew`, HEAD remained `ebb5a27422f630c656539fe31ab2b566deedecd9`. No commit, merge, push, or branch/main/origin change.

## Limits

These are source-coupled deterministic and scripted Chromium checks. The forced geometry case is an artificial QA setup; the suite does not establish full gameplay fairness, player readability, or human playtest quality. No work advanced to B5/B6/BOSS-T03.
