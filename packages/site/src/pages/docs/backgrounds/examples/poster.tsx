import { DitherPoster, type ScreenKind } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { seed?: number; screen?: ScreenKind }) {
  return (
    <div class="relative h-72 w-full overflow-hidden rounded-md bg-card">
      {/* a seed lays out the tiles, their inks and ramps and the mark; inks picks
           the palette and ground the paper the open cells show (ground="#e4e1d8") */}
      <DitherPoster seed={props.seed ?? 7} screen={props.screen} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPoster,
  title: "Poster",
  studio: {
    group: "display",
    frame: { w: 320, h: 220 },
    controls: {
      inks: { demo: ["blue", "orange", "grey"], kind: "list" },
      screen: { demo: "bayer" },
      seed: { min: 0, max: 99999, step: 1 },
      speed: { min: 0, max: 12, step: 0.5 },
      cell: { min: 1, max: 10, step: 1 },
      frameRate: { min: 0, max: 60, step: 1, demo: 0 },
      paused: {},
    },
  },
})
