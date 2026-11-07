# B4.1-R1 — Correction Report

**Date:** 2026-11-04
**Branch / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9` (no commit)
**Active HTML SHA-256 after R1:** `ac315b8a44b4104e6a6190bc1f006679180cb707edf3d51e7550e420c7ba0f8a`
**B2 FSM SHA-256 after R1:** `fdb726ef7d0116cd0ce38c14702b53ca9741b7c977e880156002ba7c410117ed`

## Defect and correction

R1 was the confirmed mismatch between scheduler shot-slot progress and actual projectile acceptance. `patternShot71` is still the scheduler's progression/cadence counter; it is not evidence that `vh()` accepted or created a projectile. The real `vh()` returns `false` on capacity/geometry rejection and returns `true` only after pushing into `Ia` and recording dodge tracking.

The correction is limited to per-pattern accounting and the signal consumed by the existing B2 observer:

- `wh()` resets four R1 fields when it selects a pattern: `patternAttempt71`, `patternAccepted71`, `patternCreated71`, and `patternCompleted71`. It also records whether the selected pattern emits projectiles or uses the existing summon path.
- The existing `Th()` projectile call sites use a small wrapper around the real `vh(e, a, t, c)`. Each call increments **attempted**; a `true` return increments **accepted**; the actual `Ia.length` delta increments **created**. `patternShot71` and the authored scheduler cadence remain unchanged.
- The B2 wrapper remains downstream of `Th()` and does not choose attacks or produce combat effects. For projectile patterns, B2 starts an attack only after accepted emissions are positive. Its completion signal requires the existing scheduler to have completed normally, at least one actual acceptance, and accepted/created counts to agree. Attempted/accepted/created counts travel on B2 start/end events.
- A normally completed partial emission remains a normally completed attack in B2 (for example, 5 attempted / 2 accepted / 2 created produces one start, one completed end, and the existing recovery lifecycle). This keeps scheduler completion distinct from projectile yield.
- A normally cleared pattern with zero accepted projectiles, or a cancellation with zero attempts, produces no false B2 attack start/end/interruption or recovery. The FSM also suppresses end/interruption events when no B2 attack was active.

For this synchronous implementation, **accepted and created coincide**: a `vh()` return of `true` follows `Ia.push(...)`. The counters remain separately measured and separately asserted so that their meanings are not conflated.

## Scope boundaries preserved

No change was made to attack selection, pattern contents, priorities, timings, cooldowns, projectile budgets, hitboxes, probabilities, scheduler architecture, B1 zone capacity, B3 renderer/telegraph, resolver `artId`, assets, or HUB behavior. R2 (corridor skip/defer) and R3 (saturation gate and recovery) remain as previously classified. B2 remains an observer and does not control combat.

The pre-existing worktree modifications were preserved. There was no commit, merge, push, branch switch, or change to `main`/`origin/main`.

## Runtime confirmation

A Chromium probe on the active HTML used Pogo's real selector and `Th()` to select `fan`; a temporary, restored boss-radius change forced the real `vh()` geometry check to reject all five emissions:

- scheduler slots: **0 → 5**;
- R1 counts at completion: **5 attempted / 0 accepted / 0 created**;
- actual hostile projectiles: **0**;
- scheduler completion: **normal** and pattern cleared;
- B2 emitted the telegraph/state lifecycle only—no `attack.start`, `attack.end`, `attack.interrupted`, or `recovery.start`;
- the scheduler recovered and selected the next authored pattern (`spiral`) after 45 × 0.05 s = **2.25 s**, with all per-pattern emission counters reset.

The forced radius was a temporary QA condition, not a gameplay edit or playtest. There were no page exceptions or local-resource failures. Chromium logged two 404s for the environment's `/cdn-cgi/challenge-platform/` requests; these were host requests, not game resources.

## Regression-first evidence

The new 34-assertion R1 test and extended B2 suite were run against the saved pre-R1 HTML/FSM copies first. Both failed at the expected missing behavior (five rejected emissions had no distinct acceptance accounting; B2 partial-emission events lacked the actual counts). They pass against the corrected sources. The original B2 suite was also run unchanged against the corrected source and still passes **51/51**.

See `B4_1_R1_TEST_REPORT.md` for the complete regression matrix and browser-harness notes.
