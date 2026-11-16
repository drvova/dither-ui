import { createSignal } from "solid-js"
import { DitherToggleGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [align, setAlign] = createSignal("left")
  const ALIGN = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ]
  const [styles, setStyles] = createSignal(["bold"])
  const STYLES = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ]

  return (
    <div class="mx-auto grid max-w-sm justify-items-center gap-4">
      <DitherToggleGroup modelValue={align()} onUpdateModelValue={(v) => setAlign(v as string)} options={ALIGN} />
      <DitherToggleGroup
        modelValue={styles()}
        onUpdateModelValue={(v) => setStyles(v as string[])}
        options={STYLES}
        type="multiple"
      />
      <p class="font-mono text-[11px] text-muted-foreground">
        align: "{align()}", styles: [{styles().join(", ")}]
      </p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherToggleGroup,
  title: "Toggle group",
  studio: {
    group: "inputs",
    frame: { w: 300, h: 100 },
    model: { demo: "bold" },
    controls: { color: {}, type: {}, options: { kind: "list", demo: ["Bold", "Italic", "Underline"] } },
  },
})
