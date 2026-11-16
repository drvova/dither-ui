import { DitherHeatTrail } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { cool?: number; size?: number }) {
  // a black stage in both themes: its words take the dark theme's inks
  return (
    <div class="dark relative grid h-64 place-items-center overflow-hidden rounded-md border border-border/60 bg-black">
      <DitherHeatTrail class="absolute inset-0" cool={props.cool ?? 1.6} size={props.size ?? 3} />
      <p class="relative text-[13px] text-muted-foreground">Move a mouse or a pen across here</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherHeatTrail,
  title: "Heat trail",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      cool: { min: 0.2, max: 6, step: 0.1 },
      size: { min: 0, max: 8, step: 1 },
      cell: { min: 2, max: 12, step: 1 },
      mixBlendMode: { options: ["normal", "screen", "lighten", "plus-lighter"], demo: "normal" },
      paused: {},
    },
  },
})
