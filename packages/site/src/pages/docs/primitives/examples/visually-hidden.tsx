import { DitherVisuallyHidden } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // focusable: the skip-link pattern, Tab reveals it
  return (
    <div class="grid justify-items-center gap-3">
      <p class="text-[12px] text-muted-foreground">
        Extra context that only a screen reader should read{" "}
        <DitherVisuallyHidden>(this sentence is announced, not painted)</DitherVisuallyHidden>
      </p>
      <a
        class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        href="#box"
      >
        Tab to reveal the skip link
      </a>
      <DitherVisuallyHidden focusable>Skip to content</DitherVisuallyHidden>
    </div>
  )
}

export const meta = defineExample({
  component: DitherVisuallyHidden,
  title: "Visually hidden",
  studio: { group: "display", frame: { w: 280, h: 80 }, controls: { focusable: {} } },
})
