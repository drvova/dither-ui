// Free canvas: where a frame (or a row of them) can stand without landing
// on another. Pure boxes in world px; the store places through it.

export type Box = { x: number; y: number; w: number; h: number }

/** The clear space kept between frames (a frame's title label stands 28px
 * over it, inside this). */
export const FRAME_GAP = 40
/** How finely the search steps, in world px. */
const STEP = 20
/** How far out it looks, in steps (2400px), before giving up. */
const REACH = 120

let rings: [number, number][] | null = null
/** Every step offset within reach, nearest first (computed once). */
function offsets(): [number, number][] {
  if (rings) return rings
  const out: [number, number][] = []
  for (let i = -REACH; i <= REACH; i++) for (let j = -REACH; j <= REACH; j++) out.push([i * STEP, j * STEP])
  rings = out.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]))
  return rings
}

const meets = (a: Box, b: Box, gap: number) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap

/** The spot nearest `want` where a box its size meets none of `taken`
 * (kept `gap` apart): `want` itself when it is free, and `want` again when
 * nothing within reach is, rather than a spot far from where it was asked. */
export function freeSpot(want: Box, taken: readonly Box[], gap = FRAME_GAP): { x: number; y: number } {
  if (!taken.some((t) => meets(want, t, gap))) return { x: want.x, y: want.y }
  for (const [dx, dy] of offsets()) {
    const at = { ...want, x: want.x + dx, y: want.y + dy }
    if (!taken.some((t) => meets(at, t, gap))) return { x: at.x, y: at.y }
  }
  return { x: want.x, y: want.y }
}

/** The box around several boxes. */
export function boundsOf(boxes: readonly Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return {
    x,
    y,
    w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
    h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
  }
}
