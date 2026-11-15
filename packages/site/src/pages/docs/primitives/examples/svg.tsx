import { DitherSvg } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // decorative by default: aria-hidden
  // labeled: promoted to role=img with a name
  return (
    <div class="flex items-center justify-center gap-6">
      <DitherSvg class="size-6 text-foreground/80" viewBox="0 0 24 24">
        <path d="M4 12h16M12 4v16" stroke="currentColor" stroke-width="2" />
      </DitherSvg>
      <DitherSvg class="size-8 text-foreground" viewBox="0 0 24 24" label="Plus">
        <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.5" />
      </DitherSvg>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSvg,
  title: "Svg",
  studio: { group: "display", frame: { w: 200, h: 90 }, controls: { viewBox: {}, label: { demo: "" } }, slot: "" },
})
