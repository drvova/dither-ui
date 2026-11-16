// Old links: the site once routed by hash, and those links still arrive.
import { isLanding } from "./routes"

/** Where an old hash link on the landing's address leads (`/#/docs/<id>`,
 * `/#/studio/<what>`): the path that page has now, or
 * `null` for any other hash. */
export function legacyAddress(hash: string): string | null {
  if (hash.startsWith("#/docs")) return hash.slice(1)
  if (hash.startsWith("#/studio")) return hash.replace(/^#\/studio\/?/, "/studio#").replace(/#$/, "")
  return null
}

/** Where an old hash link leads from the app path it arrived at: the
 * landing's (`legacyAddress`), or the docs' front, which once named its
 * section in the hash (`/docs#/docs/<id>`); `null` for any other. */
export function legacyAt(path: string, hash: string): string | null {
  if (isLanding(path)) return legacyAddress(hash)
  if (/^\/docs\/?$/.test(path) && /^#\/docs\/[^/]+/.test(hash)) return legacyAddress(hash)
  return null
}
