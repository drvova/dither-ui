// What the page transition needs in a page's head, none of it a script: the
// transition itself is the stylesheet's (`app/styles.css`, a cross-document
// view transition of the `page` type, its wipe all keyframes). Arriving
// from another page, a browser paints the new one as soon as it can, and
// Chromium drops the transition when it paints a page it is still parsing
// (the docs, 1.4 MB, did; 800 kB did not), so the head holds the first
// frame to the `PAGE_END_ID` marker at the end of the body
// (`PAGE_EXPECT`, an expect link that blocks rendering till the marker is
// parsed). And the site's speculation rules make the next page ready before
// the click. No imports at runtime: the config loads this file under Node.

/** The element at the end of every route's body. */
export const PAGE_END_ID = "page-end"

/** The head's link that holds the first frame to `PAGE_END_ID`. */
export const PAGE_EXPECT = { rel: "expect", href: `#${PAGE_END_ID}`, blocking: "render" } as const

/** The site's speculation rules (Chromium; ignored elsewhere): a page of
 * the site the reader is about to open (a pointer resting on its link, or
 * pressing it) is made ready before the click, so the move lands at once.
 * The landing and the docs are rendered ahead; the Studio, an app, only
 * fetched; the share cards' renderer, the player and the kit's sources
 * never. `base` is the site's base path. */
export function speculationRules(base: string): string {
  const site = `${base}*`
  const never = ["og/*", "play/*", "kit/*", "studio*"].map((p) => ({ href_matches: `${base}${p}` }))
  return JSON.stringify({
    prerender: [{ where: { and: [{ href_matches: site }, { not: { or: never } }] }, eagerness: "moderate" }],
    prefetch: [{ where: { href_matches: `${base}studio*` }, eagerness: "moderate" }],
  })
}
