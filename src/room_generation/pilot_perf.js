// Installed only through roomDebug. Fixed sample window, no HUD, independent
// timer or frame scheduling. Sorting/copying is confined to explicit reports.
function createPilotPerf(unavailable, metadata) {
  const limit = 18000,
    delta = new Float64Array(limit),
    flags = new Uint8Array(limit);
  let running = false,
    reason = "not started",
    n = 0,
    prev = NaN,
    px,
    py,
    lastRave,
    lastDense;
  let minEnemies = 12,
    minShots = 8,
    peakEnemies = 0,
    peakShots = 0,
    meta = null;
  function reset() {
    running = false;
    reason = "reset";
    n = 0;
    prev = NaN;
    meta = null;
    peakEnemies = peakShots = 0;
  }
  function stop(why = "manual") {
    if (!running) return;
    running = false;
    reason = why;
    prev = NaN;
  }
  function start(opts = {}) {
    const why = unavailable();
    if (why) throw Error("Hangar-16: " + why);
    const e = opts.minEnemies ?? 12,
      p = opts.minProjectiles ?? 8;
    if (![e, p].every((v) => Number.isSafeInteger(v) && v >= 0))
      throw RangeError("Invalid density thresholds");
    reset();
    minEnemies = e;
    minShots = p;
    meta = metadata();
    running = true;
    reason = "capturing";
  }
  function frame(now, rave, x, y, enemies, shots) {
    const why = unavailable();
    if (why) {
      stop(why);
      return;
    }
    const dense = enemies >= minEnemies && shots >= minShots;
    peakEnemies = Math.max(peakEnemies, enemies);
    peakShots = Math.max(peakShots, shots);
    if (Number.isFinite(prev) && now > prev) {
      delta[n] = now - prev;
      flags[n++] =
        (rave && lastRave ? 1 : 0) |
        (dense && lastDense ? 2 : 0) |
        (Math.abs(px - x) + Math.abs(py - y) > 0.01 ? 4 : 0);
      if (n === limit) {
        stop("capacity");
        return;
      }
    }
    prev = now;
    px = x;
    py = y;
    lastRave = rave;
    lastDense = dense;
  }
  function stats(mask) {
    const values = [];
    let sum = 0;
    for (let i = 0; i < n; i++)
      if ((flags[i] & mask) === mask) {
        values.push(delta[i]);
        sum += delta[i];
      }
    const count = values.length;
    if (!count) return { count: 0 };
    values.sort((a, b) => a - b);
    return {
      count,
      seconds: sum / 1000,
      meanMs: sum / count,
      p95Ms: values[Math.ceil(0.95 * count) - 1],
      maxMs: values[count - 1],
    };
  }
  function report() {
    return {
      running,
      reason,
      meta,
      limit,
      minEnemies,
      minProjectiles: minShots,
      peakEnemies,
      peakProjectiles: peakShots,
      all: stats(0),
      rave: stats(1),
      raveDenseMoving: stats(7),
    };
  }
  return {
    get running() {
      return running;
    },
    frame,
    start,
    reset,
    stop,
    report,
  };
}
