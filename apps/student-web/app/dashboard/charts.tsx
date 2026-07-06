// Sof SVG chartlar — tashqi kutubxonasiz, CSP-safe.

export function LineChart({ data, max = 40 }: { data: number[]; max?: number }) {
  const W = 460;
  const H = 150;
  const padL = 34;
  const padR = 12;
  const padT = 12;
  const padB = 8;
  const gridLines = [0, 10, 20, 30, 40].filter((v) => v <= max);

  if (data.length < 2) {
    return (
      <div className="student-dash-chart-empty">
        <p>Not enough listening scores yet.</p>
        <small>Complete listening tasks to see your trend.</small>
      </div>
    );
  }

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = innerW / (data.length - 1);
  const y = (v: number) => padT + innerH - (Math.min(v, max) / max) * innerH;
  const points = data.map((v, i) => [padL + i * stepX, y(v)] as const);
  const line = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="student-dash-linechart" role="img" aria-label="Listening score trend">
      {gridLines.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="student-dash-grid" />
          <text x={padL - 10} y={y(v) + 4} className="student-dash-axis" textAnchor="end">{v}</text>
        </g>
      ))}
      <path d={line} className="student-dash-line" fill="none" />
    </svg>
  );
}

export function PieChart({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const R = 52;
  const C = 60;
  const start = -90; // 12 o'clock
  const angle = (p / 100) * 360;
  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [C + R * Math.cos(rad), C + R * Math.sin(rad)] as const;
  };
  const [sx, sy] = toXY(start);
  const [ex, ey] = toXY(start + angle);
  const largeArc = angle > 180 ? 1 : 0;
  // To'liq (100%) yoki bo'sh (0%) holatda alohida ko'rsatamiz
  const donePath = p >= 100
    ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`
    : p <= 0
      ? ""
      : `M ${C} ${C} L ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`;

  return (
    <svg viewBox="0 0 120 120" className="student-dash-pie" role="img" aria-label={`${p}% completed`}>
      <circle cx={C} cy={C} r={R} className="student-dash-pie-rest" />
      {donePath ? <path d={donePath} className="student-dash-pie-done" /> : null}
      <text x={C} y={C - 6} className="student-dash-pie-label" textAnchor="middle">{p}%</text>
      <text x={C} y={C + 14} className="student-dash-pie-sub" textAnchor="middle">{100 - p}%</text>
    </svg>
  );
}
