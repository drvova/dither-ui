import { For } from "solid-js"
import { DitherBadge } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const variants = ["gradient", "solid", "dotted", "hatched"] as const

  return (
    <div class="grid gap-5">
      <div class="flex flex-wrap items-center justify-center gap-2">
        <DitherBadge color="green">stable</DitherBadge>
        <DitherBadge color="blue">new</DitherBadge>
        <DitherBadge color="orange">beta</DitherBadge>
        <DitherBadge color="red">deprecated</DitherBadge>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <For each={variants}>
          {(v) => (
            <DitherBadge color="blue" variant={v}>
              {v}
            </DitherBadge>
          )}
        </For>
      </div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherBadge,
  title: "Badge",
  studio: {
    group: "display",
    frame: { w: 160, h: 80 },
    slot: "beta",
    controls: { color: { demo: "blue" }, variant: { options: ["gradient", "solid", "dotted", "hatched"] } },
  },
})
