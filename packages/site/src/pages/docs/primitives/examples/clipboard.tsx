import { DitherClipboard } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // scoped slot wraps the trigger: copied + copy land right here
  return (
    <div class="flex justify-center">
      <DitherClipboard value="npm i d3-scale d3-shape clsx">
        {(scope) => (
          <button
            class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            type="button"
          >
            {scope.copied ? "copied ✓" : "copy install command"}
          </button>
        )}
      </DitherClipboard>
    </div>
  )
}

export const meta = defineExample({
  component: DitherClipboard,
  title: "Clipboard",
  studio: {
    group: "display",
    frame: { w: 220, h: 90 },
    controls: { value: { demo: "copied to clipboard" }, disabled: {} },
    slot: "Click to copy",
  },
})
