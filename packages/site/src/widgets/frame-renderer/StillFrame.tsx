// A frame that plays no other frames: its chart, or its widget. What a
// reel's clip shows (a clip is never a reel), and what `FrameRenderer` shows
// for every frame but a reel.
import { Show } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import ChartRenderer from "./ChartRenderer"
import WidgetRenderer from "./WidgetRenderer"

/** `canvas`: on the Studio's canvas a chart is a region of its own, so a
 * press on it is the chart's and a frame's drag starts from around it. */
export default function StillFrame(props: { artboard: Artboard; canvas?: boolean }) {
  const still = () => {
    const w = props.artboard.widget
    return w && w.kind !== "reel" ? w : null
  }
  return (
    <Show
      when={props.artboard.widget}
      fallback={
        <div data-canvas-interactive={props.canvas ? "" : undefined} class="h-full">
          <ChartRenderer chart={props.artboard.chart} />
        </div>
      }
    >
      <Show when={still()}>{(widget) => <WidgetRenderer widget={widget()} artboardId={props.artboard.id} />}</Show>
    </Show>
  )
}
