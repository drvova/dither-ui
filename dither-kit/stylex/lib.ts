import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

/** What a component's `xstyle` takes: StyleX styles (what `stylex.create`
 * returns), class names, or a list of them, merged after its own styles. */
export type StyleProp = string | Readonly<Record<string, unknown>> | readonly (StyleProp | false | null | undefined)[]

/** The class an element gets: every StyleX style given merges through
 * `stylex.attrs` (the last to set a property wins it), class names follow. */
export function cn(...args: (StyleProp | false | null | undefined)[]): string {
  const styles: StyleXStyles[] = []
  const names: string[] = []
  const visit = (a: StyleProp | false | null | undefined): void => {
    if (!a) return
    if (typeof a === "string") names.push(a)
    else if (Array.isArray(a)) (a as readonly (StyleProp | false | null | undefined)[]).forEach(visit)
    else styles.push(a as StyleXStyles)
  }
  args.forEach(visit)
  const own = styles.length ? stylex.attrs(styles).class : undefined
  return [own, ...names].filter(Boolean).join(" ")
}
