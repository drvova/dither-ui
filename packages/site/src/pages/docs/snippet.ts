// A docs snippet as the reader reads it. Snippets are authored once, in
// Vue's notation; the reader of this site sees them in Solid (`solid.ts`),
// in the styling system they picked.
import { restyle, restyleSolid, type Sheet, styling } from "@/shared/lib/restyle"
import { toSolidCode } from "./solid"

/** An authored docs snippet as the reader reads it: Solid, in their styling
 * system (the file's stylesheet under it, named). */
export const docsCode = (vue: string): string => restyle(toSolidCode(vue), styling())

/** The same snippet as the files the reader takes: the code, and the
 * stylesheet it imports on CSS or CSS Modules, named after it. */
export const docsFiles = (vue: string, name?: string): { code: string; sheet: Sheet | null } =>
  restyleSolid(toSolidCode(vue), styling(), name)
