// The README's banner: the brand forming out of the open field, as one
// SVG a README shows as an image. Pure: the lockup's cells and each one's
// path through its moment in (the site's choreography, which the site's
// `tests/readme-art.spec.ts` hands it and pins the file to), the file's
// text out. A browser plays a CSS animation inside an SVG image (scripts
// never run there): each cell steps whole cells from waypoint to
// waypoint, as the landing's cells do; once home the cells give way to
// the brand as merged runs, which is all a reader asking for less motion
// (or a renderer without CSS animations) ever sees.

/** A point of a cell's path, in cells from the field's top left, at `t` ms. */
type ArtWaypoint = { t: number; x: number; y: number }

export type BrandArt = {
  /** The field, in cells. */
  size: { width: number; height: number }
  /** Pixels a cell is drawn at, at the image's own size. */
  scale: number
  /** The moment's length in ms: every path is home by it. */
  end: number
  /** Each lockup cell: home, whether it is the ember core, and its path. */
  cells: readonly { x: number; y: number; core: boolean; path: readonly ArtWaypoint[] }[]
  inks: { ground: string; ink: string; ember: string }
  /** What the image says to a reader who cannot see it. */
  label: string
}

const pct = (t: number, end: number) => `${+((t / end) * 100).toFixed(2)}%`
const len = (n: number) => (n === 0 ? "0" : `${n}px`)
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")

/** The cells as one path of merged runs, a run per row of touching cells. */
function runs(cells: readonly { x: number; y: number }[]): string {
  const sorted = [...cells].sort((a, b) => a.y - b.y || a.x - b.x)
  let d = ""
  for (let i = 0; i < sorted.length;) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1].y === sorted[i].y && sorted[j + 1].x === sorted[j].x + 1) j++
    d += `M${sorted[i].x} ${sorted[i].y}h${j - i + 1}v1H${sorted[i].x}z`
    i = j + 1
  }
  return d
}

/** One cell's keyframes: its path as offsets from home, each stay one rule
 * over every moment it holds, each leg stepped one cell at a time. */
function keyframes(name: string, home: { x: number; y: number }, path: readonly ArtWaypoint[], end: number): string {
  // A later waypoint at the same moment replaces an earlier one.
  const points = path.filter((p, k) => path[k + 1]?.t !== p.t)
  const stays: { times: number[]; x: number; y: number }[] = []
  for (const p of points) {
    const last = stays[stays.length - 1]
    if (last && last.x === p.x && last.y === p.y) last.times.push(p.t)
    else stays.push({ times: [p.t], x: p.x, y: p.y })
  }
  const rules = stays.map((s, k) => {
    const next = stays[k + 1]
    const steps = next ? Math.max(Math.abs(next.x - s.x), Math.abs(next.y - s.y)) : 0
    const ease = steps > 1 ? `;animation-timing-function:steps(${steps})` : ""
    const move = `transform:translate(${len(s.x - home.x)},${len(s.y - home.y)})`
    return `${s.times.map((t) => pct(t, end)).join(",")}{${move}${ease}}`
  })
  return `@keyframes ${name}{${rules.join("")}}`
}

/** The banner's SVG text. */
export function brandSvg(art: BrandArt): string {
  const { size, scale, end, cells, inks } = art
  const name = (i: number) => `c${i.toString(36)}`
  const s = `${end / 1000}s`
  const style = [
    `.m rect{animation:${s} steps(1) both}`,
    `.m{opacity:0;animation:m ${s} steps(1,end) both}`,
    `.s{animation:s ${s} steps(1,end) both}`,
    `@keyframes m{0%{opacity:1}to{opacity:0}}`,
    `@keyframes s{0%{opacity:0}to{opacity:1}}`,
    ...cells.map((c, i) => keyframes(name(i), c, c.path, end)),
    `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`,
  ].join("")
  const bone = cells.filter((c) => !c.core)
  const core = cells.filter((c) => c.core)
  const rects = cells
    .map(
      (c, i) =>
        `<rect x="${c.x}" y="${c.y}" width="1" height="1"${c.core ? ` fill="${inks.ember}"` : ""} style="animation-name:${name(i)}"/>`,
    )
    .join("")
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width * scale}" height="${size.height * scale}" shape-rendering="crispEdges" role="img" aria-label="${escape(art.label)}">`,
    `<title>${escape(art.label)}</title>`,
    `<style>${style}</style>`,
    `<rect width="${size.width}" height="${size.height}" fill="${inks.ground}"/>`,
    `<path class="s" fill="${inks.ink}" d="${runs(bone)}"/>`,
    `<path class="s" fill="${inks.ember}" d="${runs(core)}"/>`,
    `<g class="m" fill="${inks.ink}">${rects}</g>`,
    `</svg>`,
    "",
  ].join("\n")
}
