// Plan over the live collision map; execute with real keyboard input, never teleport.
module.exports = async function walkToStation(page, id = 'descent') {
  const path = await page.evaluate(id => {
    const hub = window.DD_HUB, start = hub.getState();
    const station = hub.layout().stations.find(s => s.id === id);
    if (!station) throw Error('Unknown station: ' + id);
    const step = 24, queue = [[0, 0]], parent = new Map([['0,0', null]]);
    let end;
    for (let i = 0; i < queue.length && i < 100000; i++) {
      const [a, b] = queue[i], x = start.x + a * step, y = start.y + b * step;
      if (Math.hypot(x - station.x, y - station.y) < step) { end = [a, b]; break; }
      for (const [u, v] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const next = [a + u, b + v];
        if (parent.has(String(next)) || !hub.walkable(x + u * step, y + v * step)) continue;
        parent.set(String(next), [a,b]); queue.push(next);
      }
    }
    if (!end) throw Error('No collision-free route to ' + id);
    const points = [];
    for (let k = end; k; k = parent.get(String(k))) points.unshift({x:start.x+k[0]*step,y:start.y+k[1]*step});
    return points;
  }, id);
  const deadline = Date.now() + 120000;
  for (const point of path.slice(1)) {
    while (Date.now() < deadline) {
      const state = await page.evaluate(() => window.DD_HUB.getState());
      if (state.nearStation === id) return state;
      const dx = point.x - state.x, dy = point.y - state.y;
      if (Math.hypot(dx, dy) < 9) break;
      const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
      await page.keyboard.down(key);
      await page.evaluate(({x,y}) => new Promise(resolve => {
        const timer = setTimeout(resolve, 1500);
        function moved() {
          const now = window.DD_HUB.getState();
          if (Math.hypot(now.x-x,now.y-y) > 4) { clearTimeout(timer); resolve(); }
          else requestAnimationFrame(moved);
        }
        requestAnimationFrame(moved);
      }), {x:state.x,y:state.y});
      await page.keyboard.up(key);
    }
    if (Date.now() >= deadline) throw Error('Timed out walking to ' + id);
  }
  const state = await page.evaluate(() => window.DD_HUB.getState());
  if (state.nearStation !== id) throw Error('Station not reached: ' + JSON.stringify(state));
  return state;
};
