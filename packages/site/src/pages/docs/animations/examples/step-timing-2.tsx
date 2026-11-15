import { DitherAurora } from "@dither-kit"

export default function Example() {
  // the field driver's own knob: stop-motion and fewer uploads
  // smooth, a paint throttle near 30fps
  // film: paints 8 times a second, holds between
  return (
    <div class="grid grid-cols-2 gap-3">
      <div class="overflow-hidden rounded-lg border border-border/60">
        <p class="border-b border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">Smooth</p>
        <div class="h-36">
          <DitherAurora />
        </div>
      </div>
      <div class="overflow-hidden rounded-lg border border-border/60">
        <p class="border-b border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">Frame-rate 8</p>
        <div class="h-36">
          <DitherAurora frameRate={8} />
        </div>
      </div>
    </div>
  )
}
