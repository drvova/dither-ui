// Pixel type: a 5×7 bitmap face (proportional — I, the hyphen and the
// punctuation are narrower) for the brand wordmark and the figures the page
// sets in cells (the spec row's figures). Pure: a string in, a
// list of lit cells out; `PixelWord.vue` draws them as crisp SVG squares.

/** Rows top to bottom; `#` is a lit cell. Every row of a glyph is as wide
 * as the glyph. */
const FACE: Record<string, readonly string[]> = {
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  k: ["#...", "#...", "#..#", "#.#.", "##..", "#.#.", "#..#"],
  "-": ["...", "...", "...", "###", "...", "...", "..."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "×": [".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "....."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ":": [".", ".", "#", ".", "#", ".", "."],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
}

export const PIXEL_ROWS = 7
export const PIXEL_CHARS = Object.keys(FACE).join("")

export type PixelCell = { x: number; y: number; char: number }

/** Lay `text` out on the cell grid: one empty column between glyphs. Throws
 * on a character the face lacks — every string the page sets is covered by
 * `tests/pixel-type.spec.ts`. */
export function layoutPixelText(text: string): { cells: PixelCell[]; width: number } {
  const cells: PixelCell[] = []
  let x = 0
  ;[...text].forEach((ch, i) => {
    const glyph = FACE[ch]
    if (!glyph) throw new Error(`pixel-type: no glyph for ${JSON.stringify(ch)}`)
    glyph.forEach((row, y) => {
      for (let c = 0; c < row.length; c++) if (row[c] === "#") cells.push({ x: x + c, y, char: i })
    })
    x += glyph[0].length + 1
  })
  return { cells, width: Math.max(0, x - 1) }
}
