import { DitherClipboard } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherClipboard value="npm i d3-scale d3-shape clsx">
      {(scope) => (
        <button type="button" class="rounded-md bg-muted px-3 py-1.5 text-[12px]" onClick={() => void scope.copy()}>
          {scope.copied ? "Copied" : "Copy install"}
        </button>
      )}
    </DitherClipboard>
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
