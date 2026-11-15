import { DitherTruncate } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="mx-auto w-56">
      <DitherTruncate title="quarterly-report-final-v3-actually-final.xlsx">
        quarterly-report-final-v3-actually-final.xlsx
      </DitherTruncate>
    </div>
  )
}

export const meta = defineExample({
  component: DitherTruncate,
  title: "Truncate",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { as: { kind: "select", options: ["span", "div"] }, title: { demo: "" } },
  },
})
