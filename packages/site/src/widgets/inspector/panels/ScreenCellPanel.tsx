// A screen's cell: its component's rows, whether it fills its row, and its place.
import { Show } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import {
  componentEntry,
  moveCell,
  removeCell,
  type ScreenCell,
  type ScreenModel,
  type ScreenRow,
} from "@/entities/widget"
import { Toggle } from "@/shared/ui"
import ComponentPropsPanel from "../ui/ComponentPropsPanel"
import { DELETE_KEY } from "../ui/fields"

const MOVE_KEY =
  "flex min-h-6 items-center gap-1.5 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"

export default function ScreenCellPanel(props: { screen: ScreenModel; hit: { row: ScreenRow; cell: ScreenCell } }) {
  return (
    <section class="flex flex-col gap-3">
      <p class="micro text-muted-foreground">{componentEntry(props.hit.cell.is)?.label ?? props.hit.cell.is}</p>
      <Show when={componentEntry(props.hit.cell.is)}>
        <ComponentPropsPanel entry={componentEntry(props.hit.cell.is)!} target={props.hit.cell} />
      </Show>
      <Toggle
        modelValue={props.hit.cell.grow}
        label="grow (fill row)"
        onUpdateModelValue={(v) => (props.hit.cell.grow = v)}
      />
      <div class="flex gap-1.5 pt-1">
        <button type="button" class={MOVE_KEY} onClick={() => moveCell(props.hit.row, props.hit.cell.id, -1)}>
          <DitherIcon name="ArrowLeft" size={12} strokeWidth={1.5} />
          Move left
        </button>
        <button type="button" class={MOVE_KEY} onClick={() => moveCell(props.hit.row, props.hit.cell.id, 1)}>
          <DitherIcon name="ArrowRight" size={12} strokeWidth={1.5} />
          Move right
        </button>
        <button type="button" class={DELETE_KEY} onClick={() => removeCell(props.screen, props.hit.cell.id)}>
          delete
        </button>
      </div>
    </section>
  )
}
