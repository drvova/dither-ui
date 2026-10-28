/** Container-query engine (pure): resolve a measured CONTAINER width against
 * a named bucket scale. DOM-free and clock-free like `timing.ts` — the
 * observing lives in `DitherContainer.vue`, the math here. */

/** One bucket's width range in px: `min` inclusive, `max` exclusive — CSS
 * range semantics, so a boundary width belongs to the WIDER bucket. */
export type CqRange = { min?: number; max?: number }

/** Named scale; a bare number is `{ min }` shorthand (open upper bound).
 * Declaration order never matters — buckets resolve by min, ascending. */
export type CqScale = Record<string, CqRange | number>

/** Resolution of one width: the active bucket (highest min that matches),
 * its ordinal in ascending-min order, and every bucket the width satisfies
 * (ranges may overlap — `matches` is the full set). `size: null`/`index: -1`
 * when nothing matches (or the width is non-finite). */
export type CqState = { size: string | null; index: number; matches: string[] }

/** Default scale, tuned for COMPONENTS (cards/panels at 240–720px), not the
 * viewport — pass your own `scale` for larger shells. */
export const CONTAINER_SCALE: CqScale = { xs: 0, sm: 240, md: 360, lg: 520, xl: 720 }

/** Resolve `width` (content-box px — what `@container` sees) against `scale`. */
export function resolveCq(width: number, scale: CqScale = CONTAINER_SCALE): CqState {
  const state: CqState = { size: null, index: -1, matches: [] }
  if (!Number.isFinite(width)) return state
  const buckets = Object.entries(scale)
    .map(([name, r]) => ({
      name,
      min: typeof r === "number" ? r : (r.min ?? 0),
      max: typeof r === "number" ? undefined : r.max,
    }))
    .sort((a, b) => a.min - b.min)
  let active = -1
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i]
    if (width >= b.min && (b.max === undefined || width < b.max)) {
      state.matches.push(b.name)
      active = i
    }
  }
  if (active >= 0) {
    state.size = buckets[active].name
    state.index = active
  }
  return state
}

/** Nearest `step` — the spatial half of the kit's step idea (`timing.ts`
 * quantizes time, this quantizes space: `--cq-w` holds like a frame).
 * step <= 0 or a non-finite value returns input untouched; never negative. */
export function quantize(value: number, step: number): number {
  if (!Number.isFinite(value) || step <= 0) return value
  return Math.max(0, Math.round(value / step) * step)
}
