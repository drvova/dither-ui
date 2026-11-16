// A frame the build baked into the page for a canvas: the site's post-build
// paints each kit surface in the page with the kit's own engine, reads its
// backing (one pixel a cell) and prints it into the HTML as the canvas's
// background, so the page shows the dither before any script runs. The
// canvas carries `data-dk-baked="<kind>:<id>"`; the stylesheet the build
// writes beside it holds the image. The first frame the surface uploads
// itself (`putRasterBuffer`, the one upload every raster surface makes)
// takes the bake off in the same task, so the canvas's own pixels replace
// the same pixels and nothing is drawn twice.

/** The attribute a baked canvas carries, as the build writes it. */
export const BAKED_ATTR = "data-dk-baked"

/** What the bake shows: the surface's settled frame (its entrance played
 * out, still until something changes) or its first frame (a live surface,
 * moving on from there). */
export type BakedKind = "settled" | "first"

/** The attribute's prefix for each kind. */
export const BAKED_PREFIX: Record<BakedKind, string> = { settled: "s:", first: "f:" }

type Baked = { getAttribute?(name: string): string | null } | null | undefined

/** Whether `canvas` still shows the build's settled frame: a surface that
 * finds one starts with its entrance played (the frame the bake shows is
 * where its entrance ends), so its first paint is the bake's own pixels. */
export function bakedSettled(canvas: Baked): boolean {
  return canvas?.getAttribute?.(BAKED_ATTR)?.startsWith(BAKED_PREFIX.settled) ?? false
}

/** Take the bake off a canvas about to show its own pixels. */
export function releaseBaked(canvas: { hasAttribute?(n: string): boolean; removeAttribute(n: string): void }) {
  if (canvas.hasAttribute?.(BAKED_ATTR)) canvas.removeAttribute(BAKED_ATTR)
}

/** The attribute a chart print's cell image carries (`chart-svg.ts`): a
 * build that writes the page moves its PNG out of the markup into a file
 * of the same `baked/` folder (`packages/tasks/src/bake-frames.ts`,
 * `bakePrints`). */
export const PRINT_ATTR = "data-dk-print"
