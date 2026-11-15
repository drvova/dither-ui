import { createSignal } from "solid-js"
import { DitherLanguageSelect } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [language, setLanguage] = createSignal("ja")

  return <DitherLanguageSelect modelValue={language()} onUpdateModelValue={setLanguage} />
}

export const meta = defineExample({
  component: DitherLanguageSelect,
  title: "Language select",
  studio: {
    group: "inputs",
    frame: { w: 260, h: 90 },
    controls: { includeDefault: {}, defaultLabel: {}, disabled: {} },
  },
})
