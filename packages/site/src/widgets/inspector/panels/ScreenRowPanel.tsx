// A screen's row: how its cells align and space, a cell to add, and its place.
import { For } from "solid-js"
import { editor, selectLayer } from "@/entities/editor"
import {
  addCell,
  COMPONENT_REGISTRY,
  componentEntry,
  moveScreenRow,
  removeScreenRow,
  type ScreenModel,
  type ScreenRow,
} from "@/entities/widget"
import { NumberField, Segmented } from "@/shared/ui"
import { DELETE_KEY, FIELD, KEY, ROW } from "../ui/fields"

const ROW_ALIGNS = ["start", "center", "end", "stretch"] as const
const ROW_JUSTIFY = ["start", "center", "end", "between"] as const

function addCellFromPicker(row: ScreenRow, e: Event) {
  const is = (e.target as HTMLSelectElement).value
  const entry = componentEntry(is)
  if (entry) {
    const cell = addCell(row, entry)
    selectLayer(`${editor.selectedArtboardId}:cell:${cell.id}`)
  }
  ;(e.target as HTMLSelectElement).value = ""
}

export default function ScreenRowPanel(props: { screen: ScreenModel; row: ScreenRow }) {
  return (
    <section class="flex flex-col gap-3">
      <p class="micro text-muted-foreground">Row</p>
      <Segmented
        modelValue={props.row.align}
        options={ROW_ALIGNS}
        label="align"
        onUpdateModelValue={(v) => (props.row.align = v)}
      />
      <Segmented
        modelValue={props.row.justify}
        options={ROW_JUSTIFY}
        label="justify"
        onUpdateModelValue={(v) => (props.row.justify = v)}
      />
      <NumberField
        modelValue={props.row.gap}
        label="gap"
        min={0}
        max={64}
        onUpdateModelValue={(v) => (props.row.gap = v)}
      />
      <label class={ROW}>
        <span class="prop-name">add</span>
        <select name="add-cell" class={FIELD} onChange={(e) => addCellFromPicker(props.row, e)}>
          <option value="">component…</option>
          <For each={COMPONENT_REGISTRY}>{(c) => <option value={c.is}>{c.label}</option>}</For>
        </select>
      </label>
      <div class="flex gap-1.5 pt-1">
        <button type="button" class={KEY} onClick={() => moveScreenRow(props.screen, props.row.id, -1)}>
          ↑ move
        </button>
        <button type="button" class={KEY} onClick={() => moveScreenRow(props.screen, props.row.id, 1)}>
          move ↓
        </button>
        <button type="button" class={DELETE_KEY} onClick={() => removeScreenRow(props.screen, props.row.id)}>
          delete
        </button>
      </div>
    </section>
  )
}
