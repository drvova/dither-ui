import { createMemo, For } from "solid-js"
import { docsFramework } from "./svelte"

// A row's `default` is the value as code; "" when the prop has none (shown
// as "none").
export type PropRow = { prop: string; type: string; default: string }

export type PropsTableProps = { rows: PropRow[] }

/** A row in Svelte's words. The tables are authored for the Solid kit; its
 * Svelte port binds `value` (`$bindable`) where they name `modelValue`,
 * binds a named model where they name its `onUpdate…` callback, takes a
 * one-word event as a lowercase callback (`onselect`; a two-word one keeps
 * its capitals, as the port spells it), and a snippet where they take JSX. */
export function svelteRow(row: PropRow): PropRow {
  const events = (text: string) => text.replace(/\bon([A-Z][a-z]+)\b/g, (_, name: string) => `on${name.toLowerCase()}`)
  return {
    prop: events(row.prop.replace(/\bmodelValue\b/g, "value")),
    type: events(
      row.type
        .replace(/\bwith onUpdate(\w+)/g, (_, name: string) =>
          name === "ModelValue" ? "bind:value" : `bind:${name[0].toLowerCase()}${name.slice(1)}`,
        )
        .replace(/\(([^()]*)\) => JSX\.Element/g, "Snippet<[$1]>")
        .replace(/\bJSX\.Element\b/g, "Snippet"),
    ),
    default: row.default,
  }
}

export default function PropsTable(props: PropsTableProps) {
  // a Solid reader gets the rows as written
  const shownRows = createMemo(() => (docsFramework() === "svelte" ? props.rows.map(svelteRow) : props.rows))

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
            <For each={shownRows()}>
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
        <For each={shownRows()}>
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
