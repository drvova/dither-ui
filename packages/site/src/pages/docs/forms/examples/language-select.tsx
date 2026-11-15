import { createSignal } from "solid-js"
import { DitherLanguageSelect } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [locale, setLocale] = createSignal("ja")

  return <DitherLanguageSelect modelValue={locale()} onUpdateModelValue={setLocale} includeDefault />
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
