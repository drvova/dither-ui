// A docs snippet as the reader reads it. Snippets are written in Solid,
// with Tailwind's classes; the reader of this site sees them in the styling
// system they picked.
import { restyle, restyleSolid, type Sheet, styling } from "@/shared/lib/restyle"

/** A docs snippet as the reader reads it, in their styling system (the
 * file's stylesheet under it, named). */
export const docsCode = (code: string): string => restyle(code, styling())

/** The same snippet as the files the reader takes: the code, and the
 * stylesheet it imports on CSS or CSS Modules, named after it. */
export const docsFiles = (code: string, name?: string): { code: string; sheet: Sheet | null } =>
  restyleSolid(code, styling(), name)
