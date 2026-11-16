// An example's code as its card shows it: an example module
// (`<pack>/examples/<id>.tsx`) with the props the page's pickers set written
// in, so the code shown is the demo shown. Framework free.

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

const OPEN = "([{"
const CLOSE = ")]}"

/** Where the expression starting at `from` ends: the first `,` `;`, line
 * end or unmatched closing bracket outside brackets and strings. */
function expressionEnd(text: string, from: number): number {
  let depth = 0
  for (let i = from; i < text.length; i++) {
    const c = text[i]
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < text.length && text[i] !== c; i++) if (text[i] === "\\") i++
    } else if (OPEN.includes(c)) depth++
    else if (CLOSE.includes(c)) {
      if (depth === 0) return i
      depth--
    } else if (depth === 0 && (c === "," || c === ";" || c === "\n")) return i
  }
  return text.length
}

/** The bracket that closes the one at `open`. */
function closing(text: string, open: number): number {
  const end = expressionEnd(text, open + 1)
  if (text[end] !== CLOSE[OPEN.indexOf(text[open])]) throw new Error(`exampleCode: unbalanced ${text[open]}`)
  return end
}

/** The props a page's pickers hand an example: a value each, or `undefined`
 * for one the example leaves at its own default. */
type ExampleProps = Readonly<Record<string, Data | undefined>>

/**
 * An example module as the reader takes it for the props its card's pickers
 * set. The example reads each prop the page drives as `props.<name>`,
 * written where its value goes: `props.colors ?? ["#5227FF"]` (the default
 * after `??`), or `dither={props.dither}` (an attribute the example leaves
 * out unless given). Here the props parameter goes, and each read becomes the
 * value given, else its default, else (an attribute with none) the
 * attribute goes; a string an attribute holds is written as the attribute's
 * own string (`flowDirection="up"`). So the code shown is the demo shown,
 * pickers and all, and it runs as written.
 */
export function exampleCode(source: string, values: ExampleProps = {}): string {
  const head = /export default function \w*\(/.exec(source)
  if (!head) throw new Error("exampleCode: not an example module")
  const open = head.index + head[0].length - 1
  let text = source.slice(0, open + 1) + source.slice(closing(source, open))
  const read = /props\.([A-Za-z_$][\w$]*)/g
  for (let m = read.exec(text); m; m = read.exec(text)) {
    const name = m[1]
    let end = m.index + m[0].length
    const fallback = /^\s*\?\?\s*/.exec(text.slice(end))
    let value: string | undefined
    if (fallback) {
      const from = end + fallback[0].length
      end = expressionEnd(text, from)
      value = text.slice(from, end).trim()
    }
    const given = values[name]
    if (given !== undefined) value = valueCode(given)
    const attribute = /\s+([\w-]+)=\{$/.exec(text.slice(0, m.index))
    const wrapped = attribute && text[end] === "}"
    if (value === undefined) {
      if (!wrapped) throw new Error(`exampleCode: no value for props.${name}`)
      text = text.slice(0, attribute.index) + text.slice(end + 1)
      read.lastIndex = attribute.index
      continue
    }
    const literal = wrapped && /^"[^"\\]*"$/.test(value)
    const at = literal ? m.index - 1 : m.index
    text = text.slice(0, at) + value + text.slice(literal ? end + 1 : end)
    read.lastIndex = at + value.length
  }
  return text
}
