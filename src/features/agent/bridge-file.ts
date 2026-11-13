// The bridge as the site hands it out. Imported by the build's config
// (`solid-site/site-files.ts`, which serves the file) as well as the Studio,
// so it imports nothing.

/** Where the site serves the bridge, next to its pages: the repo's own
 * file at the same path. */
export const BRIDGE_FILE = "bridge/dither-bridge.mjs"

/** The origins the bridge lets in with no `--origin`: the site's own and
 * any page on this machine (`allowedOrigin` in the bridge, pinned to this
 * by its test). */
export const bridgeKnows = (origin: string) =>
  origin === "https://dither-ui.com" || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
