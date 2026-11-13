// Old links. The Vue app once routed by hash; its links still arrive.

/** Where an old hash link on the landing's address leads (`/#/docs/<id>`,
 * `/#/studio/<what>`): the app path the Vue app moved it to in place, or
 * `null` for any other hash. */
export function legacyAddress(hash: string): string | null {
  if (hash.startsWith("#/docs")) return hash.slice(1)
  if (hash.startsWith("#/studio")) return hash.replace(/^#\/studio\/?/, "/studio#").replace(/#$/, "")
  return null
}
