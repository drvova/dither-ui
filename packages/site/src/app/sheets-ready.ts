// The app mounts on its page's own styles. SolidStart writes the client's
// entry as an async module script, which runs as soon as it arrives, not
// after the head's stylesheets, as a deferred script would: on a slow or
// busy load the app mounted and measured (a canvas's width, a rail's
// starts) under no styles at all, and Gecko said so ("Layout was forced
// before the page was fully loaded"). So the entry waits for every
// stylesheet the page links that has not loaded yet. Framework-free.

/** How long the app waits for a stylesheet before it mounts all the same:
 * a sheet that failed before it was looked at never says so again. */
export const SHEET_WAIT_MS = 3000

/** Resolves once every `<link rel="stylesheet">` in `doc` has loaded or
 * failed, at once when none is pending, after `SHEET_WAIT_MS` at most. */
export function sheetsReady(doc: Document = document, waitMs = SHEET_WAIT_MS): Promise<void> {
  const pending = [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter((l) => !l.sheet)
  if (!pending.length) return Promise.resolve()
  const settled = pending.map(
    (link) =>
      new Promise<void>((done) => {
        link.addEventListener("load", () => done(), { once: true })
        link.addEventListener("error", () => done(), { once: true })
      }),
  )
  return Promise.race([Promise.all(settled).then(() => {}), new Promise<void>((done) => setTimeout(done, waitMs))])
}
