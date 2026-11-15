import { createSignal } from "solid-js"
import { DitherMentionInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [body, setBody] = createSignal("cc @da")
  const handles = ["dana", "darius", "daniela", "sam"]
  const [notified, setNotified] = createSignal<string[]>([])

  return (
    <DitherMentionInput
      modelValue={body()}
      onUpdateModelValue={setBody}
      options={handles}
      rows={3}
      onMention={(handle) => setNotified([...notified(), handle])}
    />
  )
}

export const meta = defineExample({
  component: DitherMentionInput,
  title: "Mention input",
  studio: {
    group: "inputs",
    frame: { w: 340, h: 150 },
    controls: {
      options: { demo: ["dana", "darius", "sam"] },
      rows: { min: 2, max: 10 },
      placeholder: {},
      disabled: {},
    },
  },
})
