// A frame as the Studio draws it, wherever it stands (the canvas, the
// player): a reel playing its clips, else the frame itself.
import { Show } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import ReelRenderer from "./ReelRenderer"
import StillFrame from "./StillFrame"

export default function FrameRenderer(props: { artboard: Artboard; canvas?: boolean }) {
  const reel = () => {
    const w = props.artboard.widget
    return w?.kind === "reel" ? w : null
  }
  return (
    <Show when={reel()} fallback={<StillFrame artboard={props.artboard} canvas={props.canvas} />}>
      {(r) => <ReelRenderer reel={r()} artboardId={props.artboard.id} />}
    </Show>
  )
}
