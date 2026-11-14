import { type Component, For, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { boundProps, componentEntry, fieldLabel, type ScreenCell, type ScreenModel } from "@/entities/widget"
import * as kit from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { editor, selectLayer } from "@/entities/editor"
import { modelOf, slotChildren } from "../../entities/widget/model/model"
import { FieldWrap } from "./FieldWrap"

const JUSTIFY: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
}
const ALIGN: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
}

const resolve = (is: string) => (kit as Record<string, unknown>)[is] as Component<Record<string, unknown>>
/** A cell's model bound as the code export binds it (`modelOf`). */
function modelProps(cell: ScreenCell): Record<string, unknown> {
  const m = modelOf(componentEntry(cell.is))
  if (!m) return {}
  return { [m.prop]: cell.model, [m.on]: (value: unknown) => (cell.model = m.carries ? value : false) }
}

export default function ScreenRenderer(props: { screen: ScreenModel; artboardId: string }) {
  const cellId = (cell: ScreenCell) => `${props.artboardId}:cell:${cell.id}`
  const isSelected = (id: string) => editor.selectedLayerId === id

  /** A press on a row or a cell selects it and goes no further. One from
   * an overlay a component opened elsewhere in the page is not on it. */
  function press(e: PointerEvent & { currentTarget: HTMLElement }, id: string) {
    if (!e.currentTarget.contains(e.target as Node)) return
    e.stopPropagation()
    selectLayer(id)
  }

  return (
    <div
      class="flex h-full w-full flex-col overflow-hidden"
      style={{ gap: `${props.screen.gap}px`, padding: `${props.screen.padding}px` }}
    >
      <For each={props.screen.rows}>
        {(row) => (
          <div
            class={cn(
              "flex min-h-6 rounded-sm",
              ALIGN[row.align],
              JUSTIFY[row.justify],
              editor.selectedLayerId === `${props.artboardId}:row:${row.id}` ? "ring-1 ring-accent/60" : "",
            )}
            style={{ gap: `${row.gap}px` }}
            onPointerDown={(e) => press(e, `${props.artboardId}:row:${row.id}`)}
          >
            <For each={row.cells}>
              {(cell) => (
                <div
                  class={cn(
                    "rounded-sm",
                    cell.grow ? "flex-1 min-w-0" : "",
                    isSelected(cellId(cell)) ? "ring-1 ring-accent" : "",
                  )}
                  onPointerDown={(e) => press(e, cellId(cell))}
                >
                  <FieldWrap label={fieldLabel(cell.is, cell.props)} class="w-full">
                    <Dynamic
                      component={resolve(cell.is)}
                      {...boundProps(cell.is, cell.props)}
                      {...modelProps(cell)}
                      {...(cell.slotText != null ? { children: slotChildren(cell.is, cell.slotText) } : {})}
                      class={cell.grow ? "w-full" : ""}
                    />
                  </FieldWrap>
                </div>
              )}
            </For>
            <Show when={row.cells.length === 0}>
              <span class="px-1 text-[10px] text-muted-foreground">Empty row. Add a component in the inspector.</span>
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}
