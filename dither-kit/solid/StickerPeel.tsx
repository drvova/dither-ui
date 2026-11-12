import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"
import "./StickerPeel.css"

export type StickerPeelProps = { class?: string; children?: JSX.Element }

export default function StickerPeel(props: StickerPeelProps) {
  return (
    <div class={cn("dither-sticker relative inline-block", props.class)}>
      <div class="relative z-[1]">{props.children}</div>
      <div class="dither-peel pointer-events-none absolute bottom-0 right-0" aria-hidden="true" />
    </div>
  )
}
