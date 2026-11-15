import { For } from "solid-js"
import { DitherGradualBlur } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherGradualBlur position="bottom" height={72} strength={5} class="w-64">
      <div class="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
        <For each={Array.from({ length: 6 }, (_, i) => i + 1)}>
          {(n) => <p>Row {n}: content scrolls under the blur band.</p>}
        </For>
      </div>
    </DitherGradualBlur>
  )
}

export const meta = defineExample({
  component: DitherGradualBlur,
  title: "Gradual blur",
  studio: {
    group: "display",
    frame: { w: 280, h: 160 },
    controls: {
      position: {},
      height: { min: 16, max: 300, step: 4, demo: 96 },
      strength: { min: 0, max: 20, step: 0.5, demo: 4 },
    },
    slot: "Content fades into a soft edge as it reaches the blur band",
  },
})
