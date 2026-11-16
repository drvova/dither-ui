/** The Studio's tour: the mascot flies to each part of the window and says
 * what it is for. A stop names its part by the element it points at (the
 * page's own refs, never a selector), what is said there, and what to open
 * first so the part is showing. `StudioGuide.tsx` flies it; `placeGuide` is
 * where it hovers. */

export type GuideStop = {
  /** The part the mascot points at, read when it flies there. */
  target: () => Element | null | undefined
  line: string
  /** Opens the part first when it may be folded away. */
  show?: () => void
  /** Hover by the part's right end instead of its left (a key on the right). */
  end?: boolean
}

type Box = { left: number; top: number; right: number; bottom: number }
type Size = { width: number; height: number }

const GAP = 12
const INSET = 16
const MARGIN = 8
/** A part no taller than this (a bar, a key) is pointed at from beside it, not inside. */
const THIN = 120

/** Where the guide (the mascot and its bubble, `guide` in size) hovers for
 * a part: inside a tall part near its top, under a thin one (over it when
 * the window has no room below, a bar at its foot), at its left or its
 * right end; always whole in the window. */
export function placeGuide(part: Box, guide: Size, view: Size, end = false): { x: number; y: number } {
  const thin = part.bottom - part.top <= THIN
  const x = end ? part.right - guide.width - (thin ? 0 : INSET) : part.left + INSET
  const under = part.bottom + GAP
  const y = !thin
    ? part.top + INSET * 3
    : under + guide.height <= view.height - MARGIN
      ? under
      : part.top - GAP - guide.height
  const clamp = (v: number, max: number) => Math.round(Math.min(Math.max(v, MARGIN), Math.max(MARGIN, max - MARGIN)))
  return { x: clamp(x, view.width - guide.width), y: clamp(y, view.height - guide.height) }
}

/** Automation (the post-build, recordings, browser tests) never sees the
 * tour on its own: it would print into the page's snapshot. */
export const firstVisitTour = (seen: unknown) => seen !== true && !navigator.webdriver
