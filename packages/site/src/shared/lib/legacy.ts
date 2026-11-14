// Old links: the site once routed by hash, and those links still arrive.

/** Where an old hash link on the landing's address leads (`/#/docs/<id>`,
 * `/#/studio/<what>`): the path that page has now, or
 * `null` for any other hash. */
export function legacyAddress(hash: string): string | null {
  if (hash.startsWith("#/docs")) return hash.slice(1)
  if (hash.startsWith("#/studio")) return hash.replace(/^#\/studio\/?/, "/studio#").replace(/#$/, "")
  return null
}
