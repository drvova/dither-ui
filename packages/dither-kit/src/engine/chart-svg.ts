// The charts' print as SVG, framework-free. Each family paints its resting
// frame into a raster exactly as its canvas did (the same thresholds, alphas
// and blends, cell for cell), and `printMarkup` writes that raster in the
// smaller of two exact forms: SVG paths (`rasterInks`: one path an ink, a
// cell's exact RGBA, each row's runs of it a 1-unit stroke) or a PNG at a
// pixel a cell (`png.ts`) as an `<image>` over the cells it covers. Both
// draw in a viewBox of the raster's cells, scaled to the plot the way the
// canvas was (`preserveAspectRatio="none"`, crisp), so a server render
// shows the chart with no script and no canvas. Motion is
// the stylesheet's (`solid/chart.css`): the entrance, the hover lift, the
// pie's pop, the sparkles' twinkle; `cssEasing` writes the chart's easing
// for it.

import type { ChartContextValue, PolarChartContextValue } from "./chart-types"
import {
  easingFromSeed,
  type EasingInput,
  type EdgeEffectParams,
  GLIDE_BEZIER,
  type Glyph,
  paintColumn,
  resample,
  resolveTexture,
  sparklesFromSeed,
} from "./dither-paint"
import { distToPolygonEdge, pointInPolygon, polarX, polarY, sliceAtAngle } from "./polar"
import { PRINT_ATTR } from "./baked"
import { rasterSrc } from "./png"
import { createRasterBuffer, type RasterBuffer, setOrBlendRasterPixel } from "./raster"
import { springLinear } from "./spring"

const TOP = -Math.PI / 2
const TAU = Math.PI * 2

/** One ink of a raster: its colour, its opacity, the cells it covers. */
export type Ink = { color: string; opacity: number; d: string }

const hex = (v: number) => v.toString(16).padStart(2, "0")

/**
 * A raster's cells as SVG paths, one a distinct RGBA, in the order the scan
 * meets them. A cell's colour is its stored bytes, its opacity its alpha
 * byte, so the SVG composites exactly what `putImageData` showed. With
 * `owner` (a group per cell, -1 for none), each group gets its own inks.
 */
export function rasterInks(frame: RasterBuffer, owner?: Int16Array, groups = 1): Ink[][] {
  const { width: w, height: h, data } = frame
  const view = new Uint32Array(data.buffer, data.byteOffset, w * h)
  type Open = { ink: Ink; parts: string[]; px: number; py: number }
  const open: Map<number, Open>[] = Array.from({ length: groups }, () => new Map())
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w;) {
      const i = y * w + x
      const v = view[i]
      const g = owner ? owner[i] : 0
      if (data[i * 4 + 3] === 0 || g < 0) {
        x++
        continue
      }
      let end = x + 1
      while (end < w && view[y * w + end] === v && (!owner || owner[y * w + end] === g)) end++
      const inks = open[g]
      let o = inks.get(v)
      if (!o) {
        const p = i * 4
        o = {
          ink: {
            color: `#${hex(data[p])}${hex(data[p + 1])}${hex(data[p + 2])}`,
            opacity: +(data[p + 3] / 255).toFixed(3),
            d: "",
          },
          parts: [`M${x} ${y}.5h${end - x}`],
          px: end,
          py: y,
        }
        inks.set(v, o)
      } else {
        o.parts.push(`m${x - o.px} ${y - o.py}h${end - x}`)
        o.px = end
        o.py = y
      }
      x = end
    }
  }
  return open.map((inks) =>
    [...inks.values()].map((o) => {
      o.ink.d = o.parts.join("")
      return o.ink
    }),
  )
}

/** Text as SVG markup: a reader's words (a label, a value) in an element
 * or an attribute, escaped. */
export const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "#39" }[c]};`)

/** Inks as SVG markup: a path each, a 1-unit stroke over its runs. Only
 * digits, hex colours and path commands. */
export const inksMarkup = (inks: Ink[]): string =>
  inks
    .map(
      (ink) =>
        `<path d="${ink.d}" fill="none" stroke="${ink.color}"${ink.opacity < 1 ? ` stroke-opacity="${ink.opacity}"` : ""}/>`,
    )
    .join("")

/** The cells of group `g` (every painted cell, with no `owner`) in a
 * raster of the whole frame, every other cell clear; null when it has
 * none. The whole frame, never a crop: an image laid over the cells the
 * way the canvas was scales exactly as the canvas did, where one cropped
 * to a box at a fractional pixel resamples its edges (measured in
 * Chromium: 93% of a bar chart's pixels at an odd size). */
export function groupRaster(frame: RasterBuffer, owner: Int16Array | undefined, g: number): RasterBuffer | null {
  const { width: w, height: h, data } = frame
  const raster = createRasterBuffer(w, h)
  let any = false
  for (let i = 0; i < w * h; i++)
    if (data[i * 4 + 3] > 0 && (!owner || owner[i] === g)) {
      raster.data.set(data.subarray(i * 4, i * 4 + 4), i * 4)
      any = true
    }
  return any ? raster : null
}

/**
 * A raster's print as SVG markup, a string a group (one with no `owner`):
 * whichever of its two exact forms is shorter, the inks as paths or its
 * cells as a PNG `<image>` over the whole frame. A gradient fill holds
 * hundreds of inks, so the PNG is mostly 4 to 8 times shorter; a fill of
 * few inks can be shorter as paths.
 */
export function printMarkup(frame: RasterBuffer, owner?: Int16Array, groups = 1): string[] {
  return rasterInks(frame, owner, groups).map((group, g) => {
    const paths = inksMarkup(group)
    const raster = groupRaster(frame, owner, g)
    if (!raster) return paths
    const image = `<image ${PRINT_ATTR} width="${raster.width}" height="${raster.height}" preserveAspectRatio="none" style="image-rendering:pixelated" href="${rasterSrc(raster)}"/>`
    return image.length < paths.length ? image : paths
  })
}

/** The chart's easing as a CSS timing function, for its entrance. */
export function cssEasing(input: EasingInput): string {
  if (typeof input === "string") {
    if (input === "linear") return "linear"
    if (input === "ease-out") return "cubic-bezier(0.33, 1, 0.68, 1)"
    if (input === "spring") return springLinear()
    if (input === "glide") return `cubic-bezier(${GLIDE_BEZIER.join(", ")})`
    return "cubic-bezier(0.65, 0, 0.35, 1)"
  }
  const [x1, y1, x2, y2] = typeof input === "number" ? easingFromSeed(input) : input
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`
}

/** What heads a data index where a reader hears it: the row's first text
 * outside the series, else its place. */
export const headingOf = (row: Record<string, unknown> | undefined, keys: string[], i: number) => {
  const field = row && Object.keys(row).find((k) => !keys.includes(k) && typeof row[k] === "string")
  return field ? String(row[field]) : String(i + 1)
}

const KIND = { area: "Area", bar: "Bar", line: "Line", pie: "Pie", radar: "Radar" } as const

/** A chart as a reader hears it: its kind and its series (or slices). */
export const chartName = (type: keyof typeof KIND, labels: string[]) =>
  labels.length ? `${KIND[type]} chart: ${labels.join(", ")}` : `${KIND[type]} chart`

/** Where a chart prints before its box is measured (a server render): its
 * `<svg>` scales this into the box until the measure lands. */
export const CHART_FALLBACK = { cartesian: { width: 600, height: 240 }, polar: { width: 320, height: 320 } }

// ---- area and line ---------------------------------------------------------

/** A series' band per backing column, in rows: its value line and its floor. */
export type Surface = { top: number[]; floor: number[] }

type Cartesian = Pick<
  ChartContextValue,
  | "chartType"
  | "configKeys"
  | "bands"
  | "y"
  | "plot"
  | "glowSize"
  | "seriesSpecs"
  | "stackType"
  | "seedOf"
  | "matrixOf"
  | "selectedDataKey"
  | "focusDataKey"
  | "dimOpacity"
>

const kindOf = (s: Pick<ChartContextValue, "seriesSpecs" | "chartType">, key: string) =>
  s.seriesSpecs[key]?.kind ?? (s.chartType === "line" ? "line" : "area")

/** Each series reduced to a `[top, floor]` band per backing column: an
 * area fills from its value line to its floor, a line a glow under it. */
export function cartesianSurfaces(s: Cartesian, cols: number, rows: number): Record<string, Surface> {
  const out: Record<string, Surface> = {}
  const h0 = s.plot.height || 1
  const glow = Math.max(2, Math.round(rows * s.glowSize))
  for (const key of s.configKeys) {
    const band = s.bands[key]
    if (!band) continue
    const line = kindOf(s, key) === "line"
    const top = band.map((b) => (s.y(b[1]) / h0) * (rows - 1))
    const floor = band.map((b, i) => (line ? Math.min(rows - 1, top[i] + glow) : (s.y(b[0]) / h0) * (rows - 1)))
    out[key] = { top: resample(top, cols), floor: resample(floor, cols) }
  }
  return out
}

const dimOf = (s: Pick<ChartContextValue, "selectedDataKey" | "focusDataKey" | "dimOpacity">, key: string) => {
  const emphasis = s.selectedDataKey ?? s.focusDataKey
  return emphasis !== null && emphasis !== key ? s.dimOpacity : 1
}

/** The area and line chart's fill at rest: every column of every series. */
export function paintCartesian(frame: RasterBuffer, s: Cartesian, surfaces: Record<string, Surface>): void {
  const stacked = s.stackType === "stacked" || s.stackType === "percent"
  s.configKeys.forEach((key, si) => {
    const cur = surfaces[key]
    if (!cur) return
    const seed = s.seedOf(key)
    const variant = s.seriesSpecs[key]?.variant ?? "gradient"
    const matrix = s.matrixOf(variant)
    const isLine = kindOf(s, key) === "line"
    const dim = dimOf(s, key) * (s.seriesSpecs[key]?.opacity ?? 1)
    const sparse = stacked ? 0 : si * 0.14
    for (let x = 0; x < frame.width; x++)
      paintColumn(frame, x, cur.top[x] ?? 0, cur.floor[x] ?? 0, seed, {
        variant,
        matrix,
        intensity: 0,
        dim,
        stacked: stacked && !isLine,
        sparse,
      })
  })
}

/** What the canvas drew over the fill at a marked index, series by series:
 * a column from the value line to the floor at the crosshair's alpha and a
 * 3x3 cell at the line, both in the series colour. */
export type Crosshair = { key: string; x: number; y: number; color: string; alpha: number }

export function crosshairAt(
  s: Pick<ChartContextValue, "configKeys" | "dataLength" | "seedOf" | "seed">,
  surfaces: Record<string, Surface>,
  cols: number,
  index: number,
): Crosshair[] {
  if (s.dataLength < 2) return []
  const mx = Math.round((index / (s.dataLength - 1)) * (cols - 1))
  const alpha = s.seed !== undefined ? sparklesFromSeed(s.seed).crosshairAlpha : 0.55
  return s.configKeys.flatMap((key) => {
    const cur = surfaces[key]
    if (!cur) return []
    const fill = s.seedOf(key).fill
    return [{ key, x: mx, y: Math.round(cur.top[mx] ?? 0), color: `rgb(${fill.join(" ")})`, alpha }]
  })
}

/** A sparkle at rest: where it stands, its cells and their alphas at its
 * brightest, and its phase (the stylesheet twinkles it). */
export type Sparkle = { key: string; color: string; phase: number; cells: { x: number; y: number; a: number }[] }

export type Star = { key: string; xi: number; depth: number; phase: number }

/** The live edge's particles at their first moment, at full brightness. */
export function sparklesAt(
  s: Pick<ChartContextValue, "dataLength" | "seedOf">,
  surfaces: Record<string, Surface>,
  stars: Star[],
  fx: EdgeEffectParams,
  glyph: Glyph,
  cols: number,
  rows: number,
): Sparkle[] {
  const out: Sparkle[] = []
  const reach = Math.max(1, cols - 1)
  for (const star of stars) {
    const cur = surfaces[star.key]
    if (!cur) continue
    const life = (((star.phase * 0.03) % 1) + 1) % 1
    const baseX = (star.xi / Math.max(s.dataLength - 1, 1)) * (cols - 1)
    const sx = Math.round((((baseX + fx.driftX * life * reach) % (reach + 1)) + (reach + 1)) % (reach + 1))
    const top = cur.top[sx] ?? 0
    const floor = cur.floor[sx] ?? rows - 1
    const band = Math.max(1, floor - top)
    const drift = fx.driftY * life + 0.5 * fx.gravity * life * life
    const vy = (((star.depth * fx.spread + drift) % 1) + 1) % 1
    const sy = Math.round(top + fx.flow * vy * band)
    if (sy < 0 || sy >= rows || fx.brightBase < 0.4) continue
    const cells = glyph
      .map((g) => ({ x: sx + g.dx, y: sy + g.dy, a: +(fx.brightBase * g.a).toFixed(3) }))
      .filter((c) => c.x >= 0 && c.x < cols && c.y >= 0 && c.y < rows)
    const fill = s.seedOf(star.key).fill
    out.push({ key: star.key, color: `rgb(${fill.join(" ")})`, phase: star.phase, cells })
  }
  return out
}

/** Sparkles as SVG markup, one string (a chart holds dozens; as elements
 * each would carry a hydration key): a group a sparkle, its colour and its
 * phase (`--dk-phase`, ms into a wink of `half` ms; the wink's period and
 * floor are set once around them), a 1x1 rect a cell. */
export const sparklesMarkup = (sparkles: Sparkle[], half: number): string =>
  sparkles
    .map(
      (s) =>
        `<g class="dk-chart-sparkle" fill="${s.color}" style="--dk-phase:${-Math.round((s.phase / 360) * 2 * half)}ms">` +
        s.cells
          .map((c) => `<rect x="${c.x}" y="${c.y}" width="1" height="1"${c.a < 1 ? ` fill-opacity="${c.a}"` : ""}/>`)
          .join("") +
        "</g>",
    )
    .join("")

// ---- bar -------------------------------------------------------------------

/** A series' bars per data index, in backing rows. */
export type Bars = { top: number[]; base: number[] }

type BarChart = Cartesian & Pick<ChartContextValue, "dataLength" | "barSlot">

export function barTargets(s: BarChart, rows: number): Record<string, Bars> {
  const out: Record<string, Bars> = {}
  const h0 = s.plot.height || 1
  for (const key of s.configKeys) {
    const band = s.bands[key]
    if (!band) continue
    out[key] = {
      top: band.map((b) => (s.y(b[1]) / h0) * (rows - 1)),
      base: band.map((b) => (s.y(b[0]) / h0) * (rows - 1)),
    }
  }
  return out
}

/** A painted bar: its series, its index, its columns and rows. */
export type PaintedBar = { key: string; si: number; index: number; c0: number; c1: number; top: number; base: number }

/** Every bar at rest, each cell owned by its bar (`index * series + si`). */
export function paintBars(frame: RasterBuffer, s: BarChart, targets: Record<string, Bars>, owner: Int16Array) {
  const stacked = s.stackType === "stacked" || s.stackType === "percent"
  const keys = s.configKeys
  const fx = frame.width / Math.max(s.plot.width, 1)
  const bars: PaintedBar[] = []
  keys.forEach((key, si) => {
    const t = targets[key]
    if (!t) return
    const seed = s.seedOf(key)
    const variant = s.seriesSpecs[key]?.variant ?? "gradient"
    const matrix = s.matrixOf(variant)
    const dim = dimOf(s, key) * (s.seriesSpecs[key]?.opacity ?? 1)
    for (let i = 0; i < s.dataLength; i++) {
      const base = t.base[i] ?? frame.height - 1
      const top = t.top[i] ?? base
      const slot = s.barSlot(i, si, keys.length)
      const c0 = Math.round(slot.x * fx)
      const c1 = Math.round((slot.x + slot.width) * fx)
      const id = i * keys.length + si
      for (let x = c0; x < c1; x++) {
        paintColumn(frame, x, top, base, seed, { variant, matrix, intensity: 0, dim, stacked })
        if (x < 0 || x >= frame.width) continue
        for (let y = Math.max(0, Math.round(top)); y <= Math.min(frame.height - 1, Math.round(base)); y++)
          if (owner[y * frame.width + x] < 0) owner[y * frame.width + x] = id
      }
      bars.push({ key, si, index: i, c0, c1, top, base })
    }
  })
  return bars
}

// ---- pie -------------------------------------------------------------------

type Polar = Pick<
  PolarChartContextValue,
  | "center"
  | "outerRadius"
  | "innerRadius"
  | "rimWidth"
  | "seedOf"
  | "variantOf"
  | "matrixOf"
  | "selectedDataKey"
  | "focusDataKey"
  | "dimOpacity"
  | "plot"
>

/** The pie at rest, each cell owned by its slice. */
export function paintPie(frame: RasterBuffer, s: Polar & Pick<PolarChartContextValue, "pie">, owner: Int16Array): void {
  const slices = s.pie
  if (!slices) return
  const { width: cols, height: rows } = frame
  const { width, height } = s.plot
  for (let y = 0; y < rows; y++) {
    const py = ((y + 0.5) * height) / rows
    for (let x = 0; x < cols; x++) {
      const px = ((x + 0.5) * width) / cols
      const dx = px - s.center.x
      const dy = py - s.center.y
      const r = Math.hypot(dx, dy)
      if (r < s.innerRadius || r > s.outerRadius) continue
      const si = sliceAtAngle(slices, Math.atan2(dy, dx))
      if (si < 0) continue
      const slice = slices[si]
      const seed = s.seedOf(slice.name)
      const selDim = dimOf(s, slice.name)
      owner[y * cols + x] = si
      if (s.outerRadius - r < s.rimWidth) {
        setOrBlendRasterPixel(frame, x, y, seed.fill, selDim)
        continue
      }
      const variant = s.variantOf(slice.name)
      const tex = resolveTexture(variant)
      const mat = s.matrixOf(variant)
      const raw = (r - s.innerRadius) / Math.max(s.outerRadius - s.innerRadius, 1)
      const density = 1 - tex.ramp * (1 - raw)
      if (tex.hatch >= 2 && (x + y) % tex.hatch >= tex.hatch / 2) continue
      const lit = density > mat[y & 3][x & 3] - tex.density
      if (tex.gaps && !lit) continue
      const k = tex.alphaFloor + density * tex.alphaRange
      setOrBlendRasterPixel(frame, x, y, seed.fill, Math.min(1, (lit ? k : k * tex.offTier) * selDim))
    }
  }
}

/** A slice's outline in plot px (its hit area): an annulus sector. */
export function slicePath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${polarX(cx, r, a).toFixed(2)} ${polarY(cy, r, a).toFixed(2)}`
  if (a1 - a0 >= TAU - 1e-6) {
    const ring = (r: number) => `M${p(r, a0)}A${r} ${r} 0 1 1 ${p(r, a0 + Math.PI)}A${r} ${r} 0 1 1 ${p(r, a0)}Z`
    return r0 > 0 ? ring(r1) + ring(r0) : ring(r1)
  }
  const large = a1 - a0 > Math.PI ? 1 : 0
  const outer = `M${p(r1, a0)}A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)}`
  return r0 > 0 ? `${outer}L${p(r0, a1)}A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)}Z` : `${outer}L${cx} ${cy}Z`
}

// ---- radar -----------------------------------------------------------------

type RadarChart = Polar & Pick<PolarChartContextValue, "radar" | "configKeys" | "data" | "falloff">

/** Each series' polygon in plot px, scaled by `prog` from the centre. */
export function radarPolygons(s: RadarChart, prog = 1) {
  const radar = s.radar
  if (!radar) return []
  return s.configKeys.map((key) => {
    const poly: number[] = []
    const pts: { x: number; y: number }[] = []
    radar.axes.forEach((ax, i) => {
      const v = Number(s.data[i]?.[key]) || 0
      const r = (v / radar.max) * s.outerRadius * prog
      const x = polarX(s.center.x, r, ax.angle)
      const y = polarY(s.center.y, r, ax.angle)
      poly.push(x, y)
      pts.push({ x, y })
    })
    return { key, poly, pts }
  })
}

/** The radar's polygons at rest (its vertices are the layer's own marks). */
export function paintRadar(frame: RasterBuffer, s: RadarChart): void {
  if (!s.radar) return
  const { width: cols, height: rows } = frame
  const { width, height } = s.plot
  const polys = radarPolygons(s)
  const band = Math.max(s.outerRadius * s.falloff, 1)
  for (let y = 0; y < rows; y++) {
    const py = ((y + 0.5) * height) / rows
    for (let x = 0; x < cols; x++) {
      const px = ((x + 0.5) * width) / cols
      let covered = false
      for (let pi = 0; pi < polys.length; pi++) {
        const { key, poly } = polys[pi]
        if (!pointInPolygon(px, py, poly)) continue
        const seed = s.seedOf(key)
        const variant = s.variantOf(key)
        const selDim = dimOf(s, key)
        const dist = distToPolygonEdge(px, py, poly)
        if (dist < 1.4) {
          setOrBlendRasterPixel(frame, x, y, seed.fill, selDim)
          covered = true
          continue
        }
        const tex = resolveTexture(variant)
        const mat = s.matrixOf(variant)
        const raw = 1 - Math.min(1, dist / band)
        const density = 1 - tex.ramp * (1 - raw)
        if (tex.hatch >= 2 && (x + y) % tex.hatch >= tex.hatch / 2) continue
        const lit = density > mat[y & 3][x & 3] - tex.density + pi * 0.2
        if (!lit && (tex.gaps || covered)) continue
        const k = tex.alphaFloor + density * tex.alphaRange
        setOrBlendRasterPixel(frame, x, y, seed.fill, Math.min(1, (lit ? k : k * tex.offTier) * selDim))
        covered = true
      }
    }
  }
  // Each vertex a cell over the fill; the hovered one grows (the layer's).
  for (const v of radarVertices(s, cols, rows)) setOrBlendRasterPixel(frame, v.x, v.y, s.seedOf(v.key).fill, v.alpha)
}

/** The radar's vertices in backing cells: a cell each at rest, the
 * hovered axis's grown to 3x3 over the print. */
export function radarVertices(s: RadarChart, cols: number, rows: number) {
  const fx = cols / Math.max(s.plot.width, 1)
  const fy = rows / Math.max(s.plot.height, 1)
  return radarPolygons(s).flatMap(({ key, pts }) => {
    const fill = s.seedOf(key).fill
    return pts.map((p, i) => ({
      key,
      index: i,
      x: Math.round(p.x * fx),
      y: Math.round(p.y * fy),
      color: `rgb(${fill.join(" ")})`,
      alpha: dimOf(s, key),
    }))
  })
}

/** A fresh raster and an owner map with no owner yet. */
export function blankPrint(cols: number, rows: number): { frame: RasterBuffer; owner: Int16Array } {
  return { frame: createRasterBuffer(cols, rows), owner: new Int16Array(cols * rows).fill(-1) }
}

export { TOP as PIE_TOP }
