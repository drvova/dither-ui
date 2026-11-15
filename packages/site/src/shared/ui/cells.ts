// Cell pictures (the brand mark, the mascot, its car) drawn in few shapes:
// along each row, neighbours of one paint merge into a run, and a paint's
// runs print as one path, the same pixels in a fraction of the markup.

/** A row's run of cells of one paint. */
type Run = { x: number; y: number; w: number; paint: string }

/** Cells merged into runs: along each row, neighbours of the same `paintOf`
 * become one run, so the picture draws in a fraction of the rects and
 * prints the same pixels. */
export function toRuns<T extends { x: number; y: number }>(cells: readonly T[], paintOf: (c: T) => string): Run[] {
  const sorted = [...cells].sort((a, b) => a.y - b.y || a.x - b.x)
  const runs: Run[] = []
  for (const c of sorted) {
    const paint = paintOf(c)
    const last = runs[runs.length - 1]
    if (last && last.y === c.y && last.x + last.w === c.x && last.paint === paint) last.w++
    else runs.push({ x: c.x, y: c.y, w: 1, paint })
  }
  return runs
}

/** Each paint's runs as one path's data, a cell a unit, in the order the
 * paints first appear. */
export function runPaths<T extends { x: number; y: number }>(
  cells: readonly T[],
  paintOf: (c: T) => string,
): { paint: string; d: string }[] {
  const paths = new Map<string, string>()
  for (const r of toRuns(cells, paintOf))
    paths.set(r.paint, `${paths.get(r.paint) ?? ""}M${r.x} ${r.y}h${r.w}v1h-${r.w}z`)
  return [...paths].map(([paint, d]) => ({ paint, d }))
}
