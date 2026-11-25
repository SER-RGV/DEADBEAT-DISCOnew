const labels = {
  start: "Vestíbulo de pista",
  combat: "Pista de baile",
  elite: "Sala de máquinas",
  treasure: "Almacén clandestino",
  shop: "La cabina · Tienda",
  event: "Cabina de DJ",
  challenge: "Pasillo de servicio",
  secret: "Camerino oculto",
  supersecret: "Reserva privada",
  boss: "Arena del residente",
  rest: "Salón de descanso",
  special: "Palco VIP",
};
function room(seed, floor, local, type) {
  const rng = stream(seed, floor, "shell:" + local),
    big = type === "boss" || type === "elite";
  const templates = {
    hall: ["wide", 1580, 890],
    square: ["compact", 1100, 1100],
    shaft: ["tower", 1040, 1340],
    service: ["wide", 1720, 810],
    arena: ["octagon", 1620, 1120],
  };
  const allowed = big
    ? ["arena"]
    : ["shop", "rest", "special", "secret", "supersecret"].includes(type)
      ? ["square", "shaft"]
      : type === "challenge"
        ? ["service", "shaft"]
        : ["hall", "square", "shaft", "service"];
  const [base, width, height] = templates[pick(rng, allowed)];
  const w = width + 20 * Math.floor(rng() * 8),
    h = base === "compact" ? w : height + 20 * Math.floor(rng() * 8);
  // Keep a long axis-aligned docking edge on every side. Corner cuts never
  // intrude on a centre-to-door lane, even on the narrowest template.
  const cut = () => 0.06 + 0.11 * rng(),
    a = cut(),
    b = cut(),
    c = cut(),
    d = cut();
  const pts =
    !big && rng() < 0.28
      ? [
          [0.03, 0.03],
          [0.97, 0.03],
          [0.97, 0.97],
          [0.03, 0.97],
        ]
      : [
          [a, 0.03],
          [1 - b, 0.03],
          [0.97, b],
          [0.97, 1 - c],
          [1 - c, 0.97],
          [d, 0.97],
          [0.03, 1 - d],
          [0.03, a],
        ];
  return {
    id: "rg2-" + type + "-" + base,
    label: labels[type],
    base,
    w,
    h,
    pts,
    center: [0.5, 0.5],
    index: floor === 9 ? 99 : floor * 11 + local,
  };
}
