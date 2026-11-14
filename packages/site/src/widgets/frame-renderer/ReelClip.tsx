// One clip of a reel: the referenced frame at its own size, centred and
// scaled down (never up) to fit the reel's frame, rendered by the same
// renderers the Studio and the player use.
import type { Artboard } from "@/entities/artboard"
import StillFrame from "./StillFrame"

export default function ReelClip(props: { artboard: Artboard; scale: number }) {
  return (
    <div
      class="absolute top-1/2 left-1/2 bg-card/60 p-3 text-[13px] text-foreground"
      data-clip={props.artboard.id}
      style={{
        width: `${props.artboard.w}px`,
        height: `${props.artboard.h}px`,
        transform: `translate(-50%, -50%) scale(${props.scale})`,
      }}
    >
      <StillFrame artboard={props.artboard} />
    </div>
  )
}
