// A screen frame: its rows' gap and padding, or the row or cell picked in it.
import { createMemo, Match, Switch } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { editor } from "@/entities/editor"
import { addScreenRow, findCell, findRow } from "@/entities/widget"
import { NumberField } from "@/shared/ui"
import { KEY } from "../ui/fields"
import ScreenCellPanel from "./ScreenCellPanel"
import ScreenRowPanel from "./ScreenRowPanel"
import type { WidgetPanelProps } from "./types"

export default function ScreenPanel(props: WidgetPanelProps<"screen">) {
  // The row or cell picked in the screen, read off the selected layer's id.
  const row = createMemo(() => {
    const match = editor.selectedLayerId.match(/:row:(.+)$/)
    return match ? findRow(props.widget, match[1]) : undefined
  })
  const cell = createMemo(() => {
    const match = editor.selectedLayerId.match(/:cell:(.+)$/)
    return match ? findCell(props.widget, match[1]) : undefined
  })
  return (
    <Switch
      fallback={
        <section class="flex flex-col gap-3">
          <p class="micro text-muted-foreground">Screen</p>
          <NumberField
            modelValue={props.widget.gap}
            label="row gap"
            min={0}
            max={64}
            onUpdateModelValue={(v) => (props.widget.gap = v)}
          />
          <NumberField
            modelValue={props.widget.padding}
            label="padding"
            min={0}
            max={64}
            onUpdateModelValue={(v) => (props.widget.padding = v)}
          />
          <button type="button" class={cn("self-start", KEY)} onClick={() => addScreenRow(props.widget)}>
            + row
          </button>
        </section>
      }
    >
      <Match when={cell()}>{(hit) => <ScreenCellPanel screen={props.widget} hit={hit()} />}</Match>
      <Match when={row()}>{(picked) => <ScreenRowPanel screen={props.widget} row={picked()} />}</Match>
    </Switch>
  )
}
