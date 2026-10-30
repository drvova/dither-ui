// Writing a Vue SFC out of document values. A document arrives from files,
// links and agents, and the code it becomes is written into someone's
// project, so every value goes in as data, never as code: these are the only
// ways the code generators put a value into an SFC.

const unicode = (c: string) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`

/** A static attribute's value: its quotes and ampersands as entities. */
export const attr = (v: unknown): string => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;")

/** A JS literal of any JSON value, safe in `<script setup>` (no `</script>`)
 * and in a single-quoted bound attribute (no `'`, no entity): `<`, `>`, `&`
 * and `'` only ever occur inside its strings, as unicode escapes. */
export const js = (v: unknown): string => JSON.stringify(v ?? null).replace(/[<>&'\u2028\u2029]/g, unicode)

/** An object key: bare when it is an identifier, quoted otherwise. */
export const key = (k: string): string => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : js(k))

/** `{ blur: 3, blend: "screen" }`, for a single-quoted bound attribute. */
export const objectLiteral = (o: object): string =>
  `{ ${Object.entries(o)
    .map(([k, v]) => `${key(k)}: ${js(v)}`)
    .join(", ")} }`

/** Template text: as it is when plain, otherwise one interpolation of its
 * literal, so markup and mustaches in it stay words. */
export const text = (s: string): string => (/[<>&{}]/.test(s) ? `{{ ${js(s).replace(/[{}]/g, unicode)} }}` : s)
