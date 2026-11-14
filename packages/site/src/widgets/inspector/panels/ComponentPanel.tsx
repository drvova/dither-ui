// A registry component's frame: its rows read off the component's entry.
import { Show } from "solid-js"
import { componentEntry } from "@/entities/widget"
import ComponentPropsPanel from "../ui/ComponentPropsPanel"
import type { WidgetPanelProps } from "./types"

export default function ComponentPanel(props: WidgetPanelProps<"component">) {
  return (
    <Show when={componentEntry(props.widget.is)}>
      {(spec) => (
        <section class="flex flex-col gap-3">
          <p class="micro text-muted-foreground">{spec().label}</p>
          <ComponentPropsPanel entry={spec()} target={props.widget} />
        </section>
      )}
    </Show>
  )
}
