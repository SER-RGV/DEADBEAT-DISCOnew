// All positions are normalized to the shell. Reserve the centre, docking
// corridors and spawn belt; native collision validation gets the final veto.
function populate(seed, floor, local, type) {
  const decor = stream(seed, floor, "fixtures:" + local),
    spawn = stream(seed, floor, "cast:" + local);
  const props = [],
    spawns = [];
  const fixtures =
    type === "elite"
      ? ["machine", "crate"]
      : type === "rest"
        ? ["planter", "barrel"]
        : ["barrel", "crate", "planter", "pillar"];
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1,
      sy = i < 2 ? -1 : 1;
    props.push({
      x: 0.5 + sx * (0.22 + 0.045 * decor()),
      y: 0.5 + sy * (0.21 + 0.04 * decor()),
      kind: pick(decor, fixtures),
    });
    spawns.push(
      {
        x: 0.5 + sx * (0.3 + 0.035 * spawn()),
        y: 0.5 + sy * (0.1 + 0.025 * spawn()),
      },
      {
        x: 0.5 + sx * (0.09 + 0.035 * spawn()),
        y: 0.5 + sy * (0.31 + 0.025 * spawn()),
      },
    );
  }
  return { props, spawns, reward: { x: 0.5, y: 0.43 } };
}
