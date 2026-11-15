// A frame as the Studio draws it, wherever it stands (the canvas, the
// player): a reel playing its clips, else the frame itself. Its kit glyphs
// draw their own paths, never the site's sprite: a frame is drawn to a PNG
// and exported as a video, neither of which can fetch the file.
import { Show } from "solid-js"
import { IconSprite } from "@dither-ui/kit"
import type { Artboard } from "@/entities/artboard"
import ReelRenderer from "./ReelRenderer"
import StillFrame from "./StillFrame"

export default function FrameRenderer(props: { artboard: Artboard; canvas?: boolean }) {
  const reel = () => {
    const w = props.artboard.widget
    return w?.kind === "reel" ? w : null
  }
  return (
    <IconSprite.Provider value={null}>
      <Show when={reel()} fallback={<StillFrame artboard={props.artboard} canvas={props.canvas} />}>
        {(r) => <ReelRenderer reel={r()} artboardId={props.artboard.id} />}
      </Show>
    </IconSprite.Provider>
  )
}
