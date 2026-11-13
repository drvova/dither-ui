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

type Data = string | number | boolean | readonly Data[] | { readonly [key: string]: Data }

/** A key as a reader's object literal writes it: bare when it can be. */
const keyCode = (key: string) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key))

/** A value as a reader writes it on one line. */
const valueCode = (v: Data): string =>
  Array.isArray(v)
    ? `[${v.map(valueCode).join(", ")}]`
    : typeof v === "object"
      ? `{ ${Object.entries(v as Record<string, Data>)
          .map(([k, x]) => `${keyCode(k)}: ${valueCode(x)}`)
          .join(", ")} }`
      : JSON.stringify(v)

/** An example's sample data as the line that declares it in the example,
 * printed from the very values its demo renders, so the two never drift:
 * a list one item a line (`const rows = [\n  { month: "Jan", revenue: 42 },`)
 * or an object one entry a line (a chart config). */
export function dataCode(name: string, value: readonly Data[] | { readonly [key: string]: Data }) {
  const lines = Array.isArray(value)
    ? value.map((item) => `  ${valueCode(item)},`)
    : Object.entries(value).map(([k, v]) => `  ${keyCode(k)}: ${valueCode(v)},`)
  const [open, close] = Array.isArray(value) ? ["[", "]"] : ["{", "}"]
  return `const ${name} = ${open}\n${lines.join("\n")}\n${close}`
}
