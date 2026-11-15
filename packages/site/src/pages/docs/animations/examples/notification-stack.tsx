import { createSignal } from "solid-js"
import { DitherNotificationStack } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { variant?: "stack" | "fan" | "condensed" }) {
  const [pinned, setPinned] = createSignal(false)
  const [last, setLast] = createSignal("none")

  // stacked summary, readable list on hover, focus or tap; a tap pins;
  // spring fan-out with a per-card stagger
  return (
    <div class="flex min-h-72 flex-col items-center justify-center gap-4">
      <DitherNotificationStack
        modelValue={pinned()}
        onUpdateModelValue={setPinned}
        variant={props.variant}
        items={[
          {
            id: "n1",
            title: "Deploy finished",
            body: "dither-ui shipped to production in 42s",
            time: "2m",
            icon: "↑",
            color: "green",
          },
          {
            id: "n2",
            title: "New comment",
            body: "Rei: “the drum snaps beautifully”",
            time: "16m",
            icon: "▤",
            color: "blue",
          },
          {
            id: "n3",
            title: "Build warning",
            body: "chunk index.js is 447 kB",
            time: "1h",
            icon: "◈",
            color: "orange",
          },
        ]}
        onViewall={() => setLast("view all")}
      />
      <p class="font-mono text-[10px] text-muted-foreground">
        pinned: {String(pinned())}, last: {last()}
      </p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherNotificationStack,
  title: "Notification stack",
  studio: {
    group: "display",
    frame: { w: 300, h: 260 },
    controls: {
      color: {},
      items: { kind: "list", demo: ["Deploy finished", "New comment", "Build warning"] },
      variant: {},
      maxVisible: { min: 1, max: 5, step: 1 },
      collapsedLabel: {},
    },
  },
})
