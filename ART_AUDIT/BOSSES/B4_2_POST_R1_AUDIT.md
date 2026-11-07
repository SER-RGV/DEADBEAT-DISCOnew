# B4.2 Post-R1 Combat Audit

**Date:** 2026-11-04
**Branch / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9`
**Scope:** B4.2 post-R1 audit and validation only. No production/runtime code, canonical runner, pattern, asset, tuning, resolver, or HUB file was changed. No commit, push, merge, branch change, B5/B6, or BOSS-T03 work. R2/R3 classifications remain unchanged.
**Outcome:** R1 emission/count/recovery checks and the ten-profile browser matrix pass. **One reproducible B2 sweep recovery-event metadata gap (B2-LC-01) is documented below; no fix was applied.**

## 1. Audit basis and boundaries

The active HTML scheduler and B2 observer were exercised against the R1 baseline; the R1 source-coupled tests use the actual `vh()`, `wh()`, `Th()`, `Th()` observer and `boss_animation_state_machine.js`, with only acceptance/corridor/budget dependencies controlled. The 10-profile Chromium sample uses the live active HTML and 320 scripted ticks at 0.05 seconds per profile (16 seconds simulated), seeded randomness, and scripted stationary/orbit/retreat player paths. Selection is recorded separately from R1 projectile attempts, accepted emissions, created `Ia` projectiles, and `patternShot71` scheduler progress.

The 0.20-second post-run allowance is used when correlating lifecycle events to scheduler runs; the earlier 0.01-second join is not reused. `summon` is recorded as a non-projectile scheduler attack: its projectile R1 counters are 0/0/0, but it has B2 start/end lifecycle events. Human fun, fairness, readability, and balance are not established by these scripted checks.

## 2. Headline results

- **10/10 profiles**, **40 pattern selections**, **16.00 seconds each**; four ordinary sweepers also produced one live scheduler sweep each.
- Pattern-run outcomes: **35 normal completions, 4 active at the sample horizon, 1 phase-interrupted**. The four horizon cases are three still in warning with 0/0/0 (Bufe, Matarife, Imitador) and Núcleo’s spiral at 2/2/2 when the 16-second window ended.
- Across the 40 selected pattern runs: **372 attempts / 372 accepted / 372 created** and **424 scheduler slots**. Positive projectile counts agree exactly; scheduler slots are not projectile counts. The observed roster totals are Andén 34, Magneta 38, Bufe 40, Cajero 52, Pogo 31, Oficiante 32, Matarife 31, Imitador 34, Traidor 49, Núcleo 31. Oficiante’s two summons add no projectile counts.
- Completed projectile runs have one B2 attack start and one terminal; Traidor’s phase transition has one start and one interruption. No duplicate/unpaired attack start/terminal or overlapping B2 attack lifecycle was found. One Núcleo spiral is open only because the fixed sample ends at 16 seconds.
- **B2-LC-01:** all four natural sweeps enter attack and recovery state, but the explicit recovery event sequence is asymmetric: no `recovery.start` for a normal sweep tail, and the preceding pattern’s `recovery.end` is reported as belonging to `sweep`. See §5.

## 3. Per-profile, per-attack Chromium results

`attempted/accepted/created` are actual R1 emission counters. `slots` is `patternShot71`, the existing scheduler-progress counter. A selected attack in warning at the horizon is not an emitted attack.

| Profile | Scripted behavior | Profile total A/Ac/C | Scheduler slots | Outcomes | Selected attacks (selection time; A/Ac/C; slots; result) |
|---|---|---:|---:|---|---|
| Anden | stationary | 34/34/34 | 37 | normal completion 4 | 2.05s `fan` 5/5/5; slots 5; complete 2.90s<br>5.30s `burst` 9/9/9; slots 9; complete 6.60s<br>9.15s `ring` 15/15/15; slots 18; complete 10.25s<br>12.90s `fan` 5/5/5; slots 5; complete 13.75s |
| Magneta | orbit-clockwise | 38/38/38 | 41 | normal completion 4 | 2.05s `burst` 9/9/9; slots 9; complete 3.35s<br>5.85s `fan` 5/5/5; slots 5; complete 6.70s<br>9.00s `ring` 15/15/15; slots 18; complete 10.10s<br>12.70s `burst` 9/9/9; slots 9; complete 14.00s |
| Bufe | retreat | 40/40/40 | 47 | normal completion 3; active at horizon 1 | 3.35s `burst` 9/9/9; slots 9; complete 4.65s<br>7.00s `ring` 14/14/14; slots 18; complete 8.10s<br>10.55s `spiral` 17/17/17; slots 20; complete 13.05s<br>15.60s `burst` 0/0/0; slots 0; active at 16.00s horizon |
| Cajero | stationary | 52/52/52 | 61 | normal completion 4 | 2.05s `ring` 15/15/15; slots 18; complete 3.15s<br>5.75s `fan` 5/5/5; slots 5; complete 6.60s<br>8.90s `spiral` 17/17/17; slots 20; complete 11.40s<br>14.10s `ring` 15/15/15; slots 18; complete 15.20s |
| Pogo | orbit-clockwise | 31/31/31 | 34 | normal completion 3 | 2.05s `burst` 9/9/9; slots 9; complete 3.35s<br>5.75s `fan` 5/5/5; slots 5; complete 6.60s<br>11.45s `spiral` 17/17/17; slots 20; complete 13.95s |
| Oficiante | retreat | 32/32/32 | 42 | normal completion 4 | 2.05s `summon` 0/0/0; slots 2; complete 3.30s<br>5.90s `ring` 15/15/15; slots 18; complete 7.00s<br>9.45s `spiral` 17/17/17; slots 20; complete 11.95s<br>14.50s `summon` 0/0/0; slots 2; complete 15.75s |
| Matarife | stationary | 31/31/31 | 34 | normal completion 3; active at horizon 1 | 2.05s `spiral` 17/17/17; slots 20; complete 4.55s<br>6.95s `burst` 9/9/9; slots 9; complete 8.25s<br>13.05s `fan` 5/5/5; slots 5; complete 13.90s<br>15.95s `spiral` 0/0/0; slots 0; active at 16.00s horizon |
| Imitador | orbit-clockwise | 34/34/34 | 37 | normal completion 4; active at horizon 1 | 2.05s `fan` 5/5/5; slots 5; complete 2.90s<br>5.15s `ring` 15/15/15; slots 18; complete 6.25s<br>8.75s `burst` 9/9/9; slots 9; complete 10.05s<br>12.45s `fan` 5/5/5; slots 5; complete 13.30s<br>15.55s `ring` 0/0/0; slots 0; active at 16.00s horizon |
| Traidor | retreat | 49/49/49 | 57 | normal completion 3; cancelled or interrupted 1 | 2.05s `ring` 15/15/15; slots 18; complete 3.15s<br>5.55s `burst` 9/9/9; slots 9; complete 6.85s<br>11.75s `spiral` 10/10/10; slots 12; interrupted 13.80s (B2 terminal 13.85s)<br>14.45s `ring` 15/15/15; slots 18; complete 15.55s |
| Nucleo | stationary | 31/31/31 | 34 | normal completion 3; active at horizon 1 | 2.05s `fan` 5/5/5; slots 5; complete 2.90s<br>5.05s `ring` 15/15/15; slots 18; complete 6.15s<br>11.15s `burst` 9/9/9; slots 9; complete 12.45s<br>14.75s `spiral` 2/2/2; slots 2; active at 16.00s horizon |

**Interpretation:** all 33 normally completed projectile executions, the interrupted Traidor spiral, and the partially observed Núcleo spiral have matching positive R1 counts; the other two normal completions are Oficiante summons with no projectile R1 counts. the interrupted spiral is 10/10/10, not a rejection. Its scheduler did not reach its normal completion condition. The B2 interruption at 13.85 seconds coincides with Traidor’s chase-to-ranged phase transition; its generic reason string is `partial-emission`. This is not evidence of a failed projectile emission. The three zero-attempt selections are right-censored by the 16-second horizon and have no attack lifecycle signal.

The 424 `patternShot71` scheduler slots versus 372 `vh()` attempts are a distinction, not a mismatch. Examples include completed ring runs with 18 slots and 14–15 attempts, and completed spiral runs with 20 slots and 17 attempts. Reporting `patternShot71` as “shots emitted” would be incorrect.

## 4. Source-coupled R1 behavior across all ten profile configurations

The controlled audit runs total rejection, partial acceptance (two accepted calls), full acceptance, zero-attempt cancellation, and fresh reset using each profile’s existing attack IDs. It confirms selection/progression counters separately from actual projectile creation.

| Profile | Pattern for rejection/partial/full | All rejected A/Ac/C | Partial A/Ac/C | Full A/Ac/C | Zero-attempt cancellation; next pattern after total rejection | Scripted 2-attack sequence (total A/Ac/C) | Scripted 3-attack sequence (total A/Ac/C) |
|---|---|---:|---:|---:|---|---|---|
| Anden | `fan` | 5/0/0 | 5/2/2 | 5/5/5 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `burst` after 46 ticks, counters 0/0/0 | fan,burst (14/14/14) | fan,burst,ring (29/29/29) |
| Magneta | `burst` | 9/0/0 | 9/2/2 | 9/9/9 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `fan` after 50 ticks, counters 0/0/0 | burst,fan (14/14/14) | burst,fan,ring (29/29/29) |
| Bufe | `ring` | 15/0/0 | 15/2/2 | 15/15/15 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `spiral` after 52 ticks, counters 0/0/0 | ring,spiral (32/32/32) | ring,spiral,burst (41/41/41) |
| Cajero | `ring` | 15/0/0 | 15/2/2 | 15/15/15 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `fan` after 52 ticks, counters 0/0/0 | ring,fan (20/20/20) | ring,fan,spiral (37/37/37) |
| Pogo | `burst` | 9/0/0 | 9/2/2 | 9/9/9 | cancel `spiral` 0/0/0, no B2 lifecycle; rejection recovery → `fan` after 50 ticks, counters 0/0/0 | burst,fan (14/14/14) | burst,fan,spiral (31/31/31) |
| Oficiante | `ring` | 15/0/0 | 15/2/2 | 15/15/15 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `spiral` after 52 ticks, counters 0/0/0 | ring,spiral (32/32/32) | ring,spiral,ring (47/47/47) |
| Matarife | `spiral` | 17/0/0 | 17/2/2 | 17/17/17 | cancel `spiral` 0/0/0, no B2 lifecycle; rejection recovery → `burst` after 54 ticks, counters 0/0/0 | spiral,burst (26/26/26) | spiral,burst,fan (31/31/31) |
| Imitador | `fan` | 5/0/0 | 5/2/2 | 5/5/5 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `ring` after 46 ticks, counters 0/0/0 | fan,ring (20/20/20) | fan,ring,burst (29/29/29) |
| Traidor | `ring` | 15/0/0 | 15/2/2 | 15/15/15 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `burst` after 52 ticks, counters 0/0/0 | ring,burst (24/24/24) | ring,burst,spiral (41/41/41) |
| Nucleo | `fan` | 5/0/0 | 5/2/2 | 5/5/5 | cancel `ring` 0/0/0, no B2 lifecycle; rejection recovery → `ring` after 46 ticks, counters 0/0/0 | fan,ring (20/20/20) | fan,ring,burst (29/29/29) |

Aggregate controlled cases: total rejection **110/0/0**; partial **110/20/20**; full **110/110/110**; **10/10** zero-attempt cancellations produce no attack lifecycle; **10/10** two-attack and **10/10** three-attack sequences pass (50 individually completed pattern executions, all accepted and created). A fresh B2 reset is clean for each profile. Sequence tests use existing pattern IDs; synthetic projectiles are cleared between completed attacks to model their expiration and let the real scheduler cooldown/select the next pattern. The three-attack Oficiante sequence excludes its non-projectile `summon` and cycles its two existing projectile patterns (`ring`, `spiral`, `ring`). This is controlled scheduler evidence, not a human combat or live-load playtest.

### Active-game total-rejection probe

The live Pogo browser fixture selected its authored `fan`, advanced through its warning, temporarily enlarged the boss radius to make the active `vh()` reject all five attempts, then restored the radius. Result: **5 attempted / 0 accepted / 0 created**, five scheduler slots, normal scheduler completion, zero hostile projectiles, and no false `attack.start`, `attack.end`, `attack.interrupted`, or `recovery.start`. The next authored pattern (`spiral`) was selected after 45 ticks / **2.25 seconds**, with counters reset to 0/0/0. Expected telegraph and state-transition events remained. Evidence and canvas capture: `evidence/B4_2_post_R1/r1_browser_rejection.json` and `captures/r1_total_rejection.jpg`.

## 5. Controlled saturation, release, and scripted sequence results

The saturation runner uses the actual extracted `vh()/wh()/Th()` and B2/FSM, but the 34-count load and its lifetime are synthetic. The profile budget is 36; the current gate threshold is `t=max(18,min(60,budget+24))=60`, and the gate is `Ia.length > 0.55*t`, i.e. `34 > 33`. Across every profile configuration the 34-count load was held for 10.00 seconds: no selection, selector index stayed 0, no active pattern, and no B2 attack lifecycle event. After release, synthetic bullets had expired by 3.65 seconds and the selector picked at 3.70 seconds; the new warning had 0/0/0 counters and did not create an attack lifecycle event at selection.

| Profile | Existing pattern catalog | During 34-count hold | Synthetic load expired | Next selection after release |
|---|---|---|---:|---|
| Anden | `fan,burst,ring` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `fan` at 3.70s; counters 0/0/0 at selection |
| Magneta | `burst,fan,ring` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `burst` at 3.70s; counters 0/0/0 at selection |
| Bufe | `ring,spiral,burst` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `ring` at 3.70s; counters 0/0/0 at selection |
| Cajero | `ring,fan,spiral` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `ring` at 3.70s; counters 0/0/0 at selection |
| Pogo | `burst,fan,spiral` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `burst` at 3.70s; counters 0/0/0 at selection |
| Oficiante | `summon,ring,spiral` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `summon` at 3.70s; counters 0/0/0 at selection |
| Matarife | `spiral,burst,fan` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `spiral` at 3.70s; counters 0/0/0 at selection |
| Imitador | `fan,ring,burst` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `fan` at 3.70s; counters 0/0/0 at selection |
| Traidor | `ring,burst,spiral` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `ring` at 3.70s; counters 0/0/0 at selection |
| Nucleo | `fan,ring,burst,spiral` | 10.00s at 34; no selection, index 0; no B2 attack event | 3.65s | `fan` at 3.70s; counters 0/0/0 at selection |

This is a **source-coupled scheduler-gate/recovery test**, not gameplay stress or browser-generated projectile saturation. It does not establish performance under real player movement, many simultaneous bosses, or GPU load.

## 6. B2 lifecycle reconciliation and finding

Attack starts and terminals reconcile to pattern runs with 0.20 seconds allowance. Aggregate B2 attack events are 41 `attack.start`, 39 `attack.end`, 1 `attack.interrupted`, and 35 `recovery.start`; 36 `recovery.end` events fall within the 16-second sample. Four active sweeps are separate from `patternRuns`. There are zero duplicate/unmatched attack starts/terminals and zero overlapping B2 attack intervals. The 41st start is Núcleo’s spiral still active at the horizon; it has no terminal in the sample.

### B2-LC-01 — sweep recovery start missing; prior recovery end mislabeled

**Classification:** reproducible B2 lifecycle-event metadata/contract gap. It is **not** an R1 count mismatch, false projectile attack, scheduler completion failure, or observed gameplay cooldown failure. No R2/R3 change follows from this finding.

| Sweeper | Previous pattern recovery start | Sweep attack start | Sweep attack end | Sweep `recovery.start` | Prior recovery-end event tagged `sweep` | Sweep-tail `recovery.end` |
|---|---|---:|---:|---:|---|---:|
| Pogo | 6.65s (fan) | 7.55s | 8.95s | 0 | 7.40s tagged `sweep` | 9.30s |
| Matarife | 8.30s (burst) | 9.20s | 10.60s | 0 | 9.20s tagged `sweep` | 10.95s |
| Traidor | 6.90s (burst) | 8.25s | 9.65s | 0 | 7.80s tagged `sweep` | 10.00s |
| Nucleo | 6.20s (ring) | 7.10s | 8.50s | 0 | 7.20s tagged `sweep` | 8.85s |

In all four cases B2 enters `ATTACK_RECOVERY` at sweep `attack.end` and emits the later 0.3-second-tail `recovery.end`; thus the state/recovery timer progresses. However, no matching sweep `recovery.start` is emitted. The previous pattern’s recovery timer remains active while the sweep updates the current `rec.pattern`; when that timer expires, the prior `recovery.end` is labeled `pattern: "sweep"` (once in each sweeper), including during or immediately before the sweep’s fire interval. The source locations are `boss_animation_state_machine.js:257–271`, `273–279`, and `343–345`. This is reproducible in actual B4.2 Chromium evidence and in the captured B2 event streams, and the 60-assertion B2 regression does not assert this exact live sweep/recovery event path. No production code was changed. **Stop here for owner triage/authorization; do not advance phases or apply a fix.**

### Other B2 exceptions that are explained

- **Traidor:** spiral selected at 11.75s, first emission at 12.95s, 10/10/10 cumulative counts; phase interruption at 13.85s during chase→ranged change. One start, one interruption, no duplicate end or recovery signal.
- **Núcleo:** spiral selected at 14.75s; 2/2/2 by 15.95s; one start and no terminal before 16.00s. Sample horizon only.
- **Bufe, Matarife, Imitador:** final selected pattern remains in warning at 16.00s with 0 attempts; no attack lifecycle event is correct.
- **Oficiante:** two summon cycles are scheduler/hazard executions with B2 start/end and no projectile `vh()` counts.

## 7. Limits, classifications, and evidence

- Human fun, fairness, difficulty balance, readability, and actual player-comprehension remain **unverified** without human playtesting.
- Player motion in the browser run is scripted, not ordinary keyboard input. The 10-profile browser run is a controlled sample, not a full encounter/performance benchmark.
- Saturation load and expiry are synthetic; source-coupled pattern sequences clear synthetic projectiles between attacks. These do not prove real-time performance or complete natural cycles for every profile.
- R2/R3 retain their intentional classifications; no evidence in this B4.2 run changes them. No systems, patterns, or game balance were added or altered.
- Main evidence: `evidence/B4_2_post_R1/scenario_matrix.json`, `b2_lifecycle_reconciliation.json`, `controlled_r1_profiles.json`, `saturation_matrix.json`, `r1_browser_rejection.json`, `captures/`, and the B3/T01/T02 regression evidence subdirectories. Reproducible source-coupled runners are saved alongside the JSON evidence.
- Active HTML and FSM SHA-256 match the post-R1 reference: HTML `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a`; FSM `fdb726ef7d0116cd0ce38c14702b53ca9741b7c977e880156002ba7c410117ed`. See `evidence/B4_2_post_R1/source_hashes.json` and `evidence/B4_2_post_R1/SHA256SUMS.txt` (SHA-256 `f2ad544095a68dc56f806308bad3a616d0c208ba81f929388115bdf440b72516`; 64 evidence files) for full hashes.
