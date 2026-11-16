import { For } from "solid-js"

// A row's `default` is the value as code; "" when the prop has none (shown
// as "none").
export type PropRow = { prop: string; type: string; default: string }

/** A component's props as the kit types them (`build/props.ts`), one row
 * a prop: `virtual:dither-props/<Component>`. */
export type KitProps = { of: string; rows: readonly PropRow[] }

/** How a table prints a component's props beside what the kit says. */
type KitTable = {
  /** Props printed as one row, `a / b`: a cell they share once, else theirs joined. */
  join?: readonly (readonly string[])[]
  /** A part of the family (`Item` of a sidebar): its rows read `prop (Item)`. */
  part?: string
  /** The props a section is about (the motion handbook's), in the kit's order. */
  only?: readonly string[]
  /** Rows that are not props (the engine's functions, what the host
   * publishes for CSS), placed after the named prop, else last. */
  add?: { after?: string; rows: readonly PropRow[] }
}

/** A component's API table, from the kit's own props types: every prop it
 * declares, in its order, with its `@docs` type and `@default`. A name
 * the kit does not declare fails the page's build, and a row added that
 * the kit declares is one already printed. */
export function kitTable(props: KitProps, spec: KitTable = {}): PropRow[] {
  const known = (name: string) => {
    const found = props.rows.find((r) => r.prop === name)
    if (!found) throw new Error(`${props.of} takes no prop ${name}`)
    return found
  }
  const joined = new Map(spec.join?.map((names) => [names[0], names.map(known)]))
  const inner = new Set(spec.join?.flatMap((names) => names.slice(1)))
  const cell = (cells: string[]) =>
    cells.every((c) => c === cells[0]) ? cells[0] : cells.map((c) => c || "none").join(" / ")
  spec.only?.forEach(known)
  const rows: PropRow[] = props.rows
    .filter((r) => !inner.has(r.prop) && (!spec.only || spec.only.includes(r.prop)))
    .map((r) => {
      const group = joined.get(r.prop)
      return group
        ? {
            prop: group.map((g) => g.prop).join(" / "),
            type: cell(group.map((g) => g.type)),
            default: cell(group.map((g) => g.default)),
          }
        : r
    })
    .map((r) => (spec.part ? { ...r, prop: `${r.prop} (${spec.part})` } : r))
  if (spec.add) {
    for (const r of spec.add.rows)
      for (const name of r.prop.split(" / "))
        if (props.rows.some((k) => k.prop === name)) throw new Error(`${props.of}: ${name} is a prop, printed already`)
    const after = spec.add.after
    const at = after ? rows.findIndex((r) => known(after) && r.prop.split(" / ").includes(after)) + 1 : rows.length
    rows.splice(at, 0, ...spec.add.rows)
  }
  return rows
}

type PropsTableProps = { rows: PropRow[] }

export default function PropsTable(props: PropsTableProps) {
  return (
    <>
      {/* The API as a spec sheet: a flat shell (one hairline; the page's one
          shaped panel is the demo's well) under spec-label column heads; on a phone, where
          three columns cannot fit, each prop stacks over its type and default.
          The type column carries the notes, so it takes the most room. */}
      <div class="flat-shell mt-6 hidden overflow-x-auto sm:block">
        <table class="w-full table-fixed border-collapse text-left text-[11px]">
          <thead>
            <tr class="border-b border-border/60 text-muted-foreground">
              <th class="spec w-[24%] px-4 py-2.5">Prop</th>
              <th class="spec px-4 py-2.5">Type</th>
              <th class="spec w-[20%] px-4 py-2.5">Default</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.rows}>
              {(r) => (
                <tr class="border-b border-border/40 last:border-0">
                  <td class="px-4 py-2.5 align-top break-words text-foreground/90">{r.prop}</td>
                  <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{r.type}</td>
                  <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{r.default || "none"}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <dl class="flat-shell mt-6 overflow-hidden text-[12px] sm:hidden">
        <For each={props.rows}>
          {(r) => (
            <div class="border-b border-border/40 px-4 py-3 last:border-0">
              <dt class="break-words text-foreground/90">{r.prop}</dt>
              <dd class="mt-1.5 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-muted-foreground">
                <span class="spec">Type</span>
                <span class="break-words">{r.type}</span> <span class="spec">Default</span>
                <span class="break-words">{r.default || "none"}</span>
              </dd>
            </div>
          )}
        </For>
      </dl>
    </>
  )
}
