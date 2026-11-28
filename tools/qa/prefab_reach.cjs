// Can you actually walk out of every room? Flood-fills a grid over each new
// house with the player's own radius, using the shell polygon and the authored
// furniture colliders, then requires every door reach to be connected to the
// spawn. Catches furniture that walls a corner or an exit off.
const { chromium } = require("playwright-core"),
  assert = require("node:assert/strict");

const PROBE = `(() => {
  const pf = DD_ROOM_DEBUG.prefab(), snap = __DD_BRIDGE.getSnapshot();
  // The house geometry is authored in local coordinates; the room is placed at
  // rect.x/rect.y in the world, and contains() speaks world.
  const rect = snap.roomRect, R = 16, STEP = 14;
  const props = pf.placements
    .filter((p) => p.collider && p.collider.kind !== "none")
    .map((p) => ({ x: p.anchor.x + rect.x, y: p.anchor.y + rect.y, c: p.collider }));
  const blocked = (x, y) => {
    if (!DMO.explore.contains(x, y, R)) return true;
    for (const p of props) {
      const c = p.c, dx = x - p.x, dy = y - p.y;
      if (c.kind === "circle") {
        if (Math.hypot(dx, dy) < c.r + R) return true;
      } else if (c.kind === "rect") {
        const a = -c.angle, cs = Math.cos(a), sn = Math.sin(a);
        if (Math.abs(dx * cs - dy * sn) <= c.w / 2 + R && Math.abs(dx * sn + dy * cs) <= c.h / 2 + R)
          return true;
      } else if (c.kind === "capsule") {
        const a = -c.angle, cs = Math.cos(a), sn = Math.sin(a);
        const lx = dx * cs - dy * sn, ly = dx * sn + dy * cs;
        const off = Math.max(0, Math.abs(lx) - c.halfLength);
        if (Math.hypot(off, ly) < c.r + R) return true;
      }
    }
    return false;
  };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const w of pf.walls)
    for (const p of w.face) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  const W = Math.ceil((maxX - minX) / STEP) + 1, H = Math.ceil((maxY - minY) / STEP) + 1;
  const at = (i, j) => blocked(minX + i * STEP + rect.x, minY + j * STEP + rect.y);
  const free = new Uint8Array(W * H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) if (!at(i, j)) free[j * W + i] = 1;
  const cellOf = (x, y, r) => {
    const ci = Math.round((x - rect.x - minX) / STEP), cj = Math.round((y - rect.y - minY) / STEP);
    if (ci >= 0 && cj >= 0 && ci < W && cj < H && free[cj * W + ci]) return cj * W + ci;
    for (let rad = 1; rad <= Math.ceil(r / STEP); rad++)
      for (let dj = -rad; dj <= rad; dj++)
        for (let di = -rad; di <= rad; di++) {
          const i = ci + di, j = cj + dj;
          if (i >= 0 && j >= 0 && i < W && j < H && free[j * W + i]) return j * W + i;
        }
    return -1;
  };
  const start = cellOf(snap.player.x, snap.player.y, 80);
  const seen = new Uint8Array(W * H), queue = [];
  if (start >= 0) { seen[start] = 1; queue.push(start); }
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q], i = c % W, j = (c - i) / W;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const n = nj * W + ni;
      if (seen[n] || !free[n]) continue;
      seen[n] = 1;
      queue.push(n);
    }
  }
  const targets = pf.openings.map((o) => {
    for (const d of [50, 40, 60, 70, 85, 100, 120]) {
      const cell = cellOf(o.origin.x + o.normal.x * d + rect.x, o.origin.y + o.normal.y * d + rect.y, 30);
      if (cell >= 0) return { to: o.to, lift: !!o.lift, ok: !!seen[cell] };
    }
    return { to: o.to, lift: !!o.lift, ok: false };
  });
  let walkable = 0;
  for (let i = 0; i < free.length; i++) walkable += free[i];
  return {
    key: pf.key,
    template: pf.template,
    start,
    reachable: queue.length,
    walkable,
    total: W * H,
    doors: targets,
  };
})()`;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.DD_CHROMIUM,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    if (process.env.DD_TOPOLOGY_V3 === "1")
      await p.addInitScript(() => { window.__DD_ROOM_TOPOLOGY_V3 = true; });
    if (process.env.DD_UNIFIED_GEOMETRY === "1")
      await p.addInitScript(() => { window.__DD_UNIFIED_ROOM_GEOMETRY = true; });
    if (process.env.DD_ROOM_VARIANTS === "1")
      await p.addInitScript(() => { window.__DD_ROOM_VARIANTS_V3 = true; });
    if (process.env.DD_ROOM_SILHOUETTES === "1")
      await p.addInitScript(() => { window.__DD_ROOM_SILHOUETTES_V3 = true; });
    if (process.env.DD_CIRCLE_PROFILES === "1")
      await p.addInitScript(() => { window.__DD_CIRCLE_ROOM_PROFILES = true; });
    if (process.env.DD_DECK_REPAIR === "1")
      await p.addInitScript(() => { window.__DD_PREFAB_DECK_REPAIR = true; });
    await p.goto((process.argv[2] || "http://localhost:8000") + "/?roomDebug&roomSeed=0");
    if (process.env.DD_DECK_REPAIR === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.7.0");
    else if (process.env.DD_CIRCLE_PROFILES === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.6.0");
    else if (process.env.DD_ROOM_SILHOUETTES === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.5.0");
    else if (process.env.DD_ROOM_VARIANTS === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.4.0");
    else if (process.env.DD_UNIFIED_GEOMETRY === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.3.0");
    else if (process.env.DD_TOPOLOGY_V3 === "1")
      assert.equal(await p.evaluate(() => DD_ROOM_GENERATION.version), "2.2.0");
    await p.waitForFunction(() => window.DD_BOOT?.getState().state === "MAIN_MENU");
    await p.evaluate(() => {
      DD_HUB.enter();
      DD_HUB.exitToRun();
    });
    await p.waitForFunction(() => __DD_BRIDGE.isRunning());
    const perHouse = {}, broken = [];
    let rooms = 0, doors = 0, free = [1, 1];
    for (let floor = 0; floor < 10; floor++) {
      await p.evaluate((f) => DMO.explore.debug({ action: "goto", level: 1 + 11 * f }), floor);
      const nodes = await p.evaluate(() =>
        // r0 keeps the authored Hangar pilot; this walks the new houses only.
        DD_ROOM_DEBUG.current().nodes.filter((n) => n.prefab && n.key !== "r0").map((n) => n.key),
      );
      for (const key of nodes) {
        try {
          await p.evaluate((k) => DMO.explore.debug({ action: "goto", key: k }), key);
          await p.waitForFunction(
            (k) => DMO.explore.state().key === k && DD_ROOM_DEBUG.prefab()?.walls.length,
            key,
            { timeout: 8000 },
          );
        } catch (e) {
          broken.push(key + " (never arrived)");
          continue;
        }
        const r = await p.evaluate(PROBE);
        rooms++;
        perHouse[r.template] = (perHouse[r.template] || 0) + 1;
        doors += r.doors.length;
        assert(r.start >= 0, r.key + ": the spawn is not on the walkable grid");
        const ratio = r.reachable / r.walkable;
        if (ratio < free[0]) free[0] = ratio;
        if (ratio > free[1]) free[1] = ratio;
        for (const d of r.doors) if (!d.ok) broken.push(key + " → " + d.to + (d.lift ? " (lift)" : ""));
      }
    }
    const expectedRooms = process.env.DD_TOPOLOGY_V3 === "1" || process.env.DD_UNIFIED_GEOMETRY === "1" || process.env.DD_ROOM_VARIANTS === "1" || process.env.DD_ROOM_SILHOUETTES === "1" || process.env.DD_CIRCLE_PROFILES === "1" || process.env.DD_DECK_REPAIR === "1" ? 115 : 108;
    assert.equal(rooms, expectedRooms, "walked " + rooms + " rooms, expected " + expectedRooms);
    assert.deepEqual(broken, [], "unreachable exits: " + broken.join(", "));
    assert.deepEqual(errors, []);
    console.log(
      "PASS every door reachable from the spawn in " + rooms + " rooms (" +
        doors +
        " exits, " +
        Object.entries(perHouse).map(([h, n]) => h + " " + n).join(", ") +
        "); the spawn reaches " +
        (free[0] * 100).toFixed(0) + "–" + (free[1] * 100).toFixed(0) + "% of the free floor",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
