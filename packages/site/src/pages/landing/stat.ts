// The bento's stat card: frames exported a day over the last DAYS days. The
// headline is their sum at rest and the day under the pointer while the
// chart is scrubbed (the kit's own crosshair marks it); the line under it
// says the week's change at rest and which day it is while scrubbed. Every
// figure is read from `FRAMES`, so the card never states one it doesn't plot.
export const FRAMES: number[] = [
  360, 420, 390, 510, 480, 570, 540, 660, 630, 720, 690, 810, 780, 870, 930, 900, 990, 1050,
]
export const DAYS = FRAMES.length
export const TOTAL = FRAMES.reduce((n, f) => n + f, 0)

const sum = (from: number, to: number) => FRAMES.slice(from, to).reduce((n, f) => n + f, 0)
/** This week on the one before, in whole percent. */
export const WEEK_CHANGE = Math.round((sum(DAYS - 7, DAYS) / sum(DAYS - 14, DAYS - 7) - 1) * 100)

/** The headline: the day under the pointer, else the total. */
export const shown = (day: number | null) => (day === null ? TOTAL : (FRAMES[day] ?? TOTAL))

/** How a day reads from today. */
export const ago = (day: number) => {
  const n = DAYS - 1 - day
  return n === 0 ? "today" : n === 1 ? "yesterday" : `${n} days ago`
}
