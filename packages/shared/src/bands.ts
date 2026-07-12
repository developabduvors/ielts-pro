const BANDS: [number, number][] = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5],
  [30, 7.0], [27, 6.5], [23, 6.0], [19, 5.5],
  [15, 5.0], [13, 4.5], [10, 4.0]
];

export function scoreToBand(skill: string, correct: number, total: number): number | null {
  if (total <= 0 || correct == null) return null;
  const skillLower = skill?.toLowerCase() || "";
  if (skillLower !== "reading" && skillLower !== "listening") return null;
  const scaled = total === 40 ? correct : Math.round((correct / total) * 40);
  for (const [min, band] of BANDS) {
    if (scaled >= min) return band;
  }
  return null;
}
