import { cssColor, DitherIcon } from "@dither-ui/kit"
import { createMemo, createRenderEffect, For, Index, Show } from "solid-js"
import { addRow, addSeries, importCsv, LABEL_KEY, removeRow, renamePieSlice } from "@/entities/chart"
import { familyOf } from "@/shared/config"
import { editor, replay, selectedArtboard, selectedChart } from "@/entities/editor"

/** What Vue's `.number` made of a field's text: its number, or the text
 * itself when it reads as none. */
const numberOf = (text: string): string | number => {
  const n = parseFloat(text)
  return Number.isNaN(n) ? text : n
}

/** A field that shows a cell, as Vue's `v-model` did: written when the cell
 * changes, and left alone while it already reads as the cell (a number being
 * typed keeps its text). */
function shows(el: HTMLInputElement, read: () => unknown, number = false) {
  createRenderEffect(() => {
    const value = read() ?? ""
    if ((number ? numberOf(el.value) : el.value) !== value) el.value = String(value)
  })
}

export default function DataEditor() {
  const chart = selectedChart
  const isChartFrame = createMemo(() => !!selectedArtboard.value && !selectedArtboard.value.widget)
  const fam = createMemo(() => (chart.value ? familyOf(chart.value.type) : "cartesian"))
  const labelKey = createMemo(() => LABEL_KEY[fam()])
  const columns = createMemo(() => (fam() === "pie" ? [] : (chart.value?.series.filter((s) => s.on) ?? [])))

  function onPieName(index: number, e: Event) {
    if (!chart.value) return
    renamePieSlice(chart.value, index, (e.target as HTMLInputElement).value)
  }

  let csvInput: HTMLInputElement | undefined
  async function onCsvFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file && chart.value && importCsv(chart.value, await file.text())) replay()
    input.value = ""
  }

  return (
    <Show when={editor.dataOpen && isChartFrame() ? chart.value : null}>
      {(c) => (
        <div class="absolute inset-x-0 bottom-0 z-20 max-h-64 border-t border-border bg-card/95 backdrop-blur">
          <div class="flex h-9 items-center justify-between border-b border-border/60 px-3">
            <span class="text-[11.5px] font-medium text-muted-foreground">Data</span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                title="Replace the data from a CSV file (first column = labels)"
                class="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => csvInput?.click()}
              >
                Import CSV
              </button>
              <input
                ref={(el) => (csvInput = el)}
                type="file"
                accept=".csv,text/csv"
                name="import-csv"
                class="hidden"
                onChange={onCsvFile}
              />
              <Show when={fam() !== "pie"}>
                <button
                  type="button"
                  class="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => addSeries(c())}
                >
                  + series
                </button>
              </Show>
              <button
                type="button"
                class="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => addRow(c())}
              >
                + row
              </button>
              <button
                type="button"
                class="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Close data editor"
                onClick={() => (editor.dataOpen = false)}
              >
                <DitherIcon name="Close" size={13} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div class="max-h-[220px] overflow-auto p-2">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr class="text-left text-[11px] text-muted-foreground">
                  <th class="px-2 py-1 font-medium">{labelKey()}</th>
                  <Show when={fam() === "pie"}>
                    <th class="px-2 py-1 font-medium">value</th>
                  </Show>
                  <For each={columns()}>
                    {(s) => (
                      <th class="px-2 py-1 font-medium">
                        <span class="inline-flex items-center gap-1.5">
                          <span class="size-2 rounded-[2px]" style={{ "background-color": cssColor(s.color) }} />
                          {s.label}
                        </span>
                      </th>
                    )}
                  </For>
                  <th class="w-8" />
                </tr>
              </thead>
              <tbody>
                <Index each={c().rows}>
                  {(row, i) => (
                    <tr class="border-t border-border/40">
                      <td class="px-1 py-0.5">
                        <Show
                          when={fam() === "pie"}
                          fallback={
                            <input
                              ref={(el) => shows(el, () => row()[labelKey()])}
                              type="text"
                              name={`row-${i}-label`}
                              autocomplete="off"
                              class="w-full min-w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-foreground outline-none hover:border-border focus:border-ring"
                              onInput={(e) => (row()[labelKey()] = e.currentTarget.value)}
                            />
                          }
                        >
                          <input
                            value={row().name}
                            type="text"
                            name={`row-${i}-name`}
                            autocomplete="off"
                            class="w-full min-w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-foreground outline-none hover:border-border focus:border-ring"
                            onChange={(e) => onPieName(i, e)}
                          />
                        </Show>
                      </td>
                      <Show when={fam() === "pie"}>
                        <td class="px-1 py-0.5">
                          <input
                            ref={(el) => shows(el, () => row().value, true)}
                            type="number"
                            name={`row-${i}-value`}
                            class="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 tabular-nums text-foreground outline-none [appearance:textfield] hover:border-border focus:border-ring [&::-webkit-inner-spin-button]:appearance-none"
                            onInput={(e) => (row().value = numberOf(e.currentTarget.value))}
                          />
                        </td>
                      </Show>
                      <For each={columns()}>
                        {(s) => (
                          <td class="px-1 py-0.5">
                            <input
                              ref={(el) => shows(el, () => row()[s.key], true)}
                              type="number"
                              name={`row-${i}-${s.key}`}
                              class="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 tabular-nums text-foreground outline-none [appearance:textfield] hover:border-border focus:border-ring [&::-webkit-inner-spin-button]:appearance-none"
                              onInput={(e) => (row()[s.key] = numberOf(e.currentTarget.value))}
                            />
                          </td>
                        )}
                      </For>
                      <td class="px-1 text-right">
                        <button
                          type="button"
                          class="rounded px-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Delete row ${i + 1}`}
                          onClick={() => removeRow(c(), i)}
                        >
                          <DitherIcon name="Trash" size={12} strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  )}
                </Index>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Show>
  )
}
