import { createSignal } from "solid-js"
import { DitherMentionInput } from "@dither-kit"

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
