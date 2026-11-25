// Scoped by the build inside the native engine, also loaded by the Node harness.
const VERSION = "2.0.0";
function stream(seed, floor, channel) {
  let h = (seed >>> 0) ^ Math.imul(floor + 1, 2654435761);
  for (const ch of channel) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let z = Math.imul(h ^ (h >>> 15), h | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
