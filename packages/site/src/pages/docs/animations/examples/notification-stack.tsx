import { createSignal } from "solid-js"
import { DitherNotificationStack } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [pinned, setPinned] = createSignal(false)
  const [last, setLast] = createSignal("none")

  return (
    <>
      <DitherNotificationStack
        modelValue={pinned()}
        onUpdateModelValue={setPinned}
        items={[
          { id: "n1", title: "Deploy finished", body: "Shipped to production in 42s", time: "2m", color: "green" },
          { id: "n2", title: "New comment", body: "Rei: the drum snaps beautifully", time: "16m", color: "blue" },
          { id: "n3", title: "Build warning", body: "Chunk index.js is 447 kB", time: "1h", color: "orange" },
        ]}
        onViewall={() => setLast("view all")}
      />
      <p class="text-[10px]">
        pinned: {String(pinned())}, last: {last()}
      </p>
    </>
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
