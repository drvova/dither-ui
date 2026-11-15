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

/** A cell picture's frames (the car's wheel turns) split into what they
 * share, cells in every frame in the same paint, and what each frame adds
 * to it: the shared cells drawn once and a frame's own shown in its turn,
 * so a picture that steps draws its still part once and moves only by its
 * stylesheet. */
export function stepCells<T extends { x: number; y: number }>(
  frames: readonly (readonly T[])[],
  paintOf: (c: T) => string,
): { still: T[]; steps: T[][] } {
  const key = (c: T) => `${c.x},${c.y},${paintOf(c)}`
  const sets = frames.map((f) => new Set(f.map(key)))
  const still = (frames[0] ?? []).filter((c) => sets.every((s) => s.has(key(c))))
  const held = new Set(still.map(key))
  return { still, steps: frames.map((f) => f.filter((c) => !held.has(key(c)))) }
}
