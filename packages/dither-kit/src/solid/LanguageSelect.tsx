import { createMemo, For, type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"

/** Language picker over a curated BCP 47 list — native select semantics,
 * label is the human name, value is the tag. An optional "System default"
 * first entry keeps the opt-out one option away. */
const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "en-GB", label: "English (United Kingdom)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Čeština" },
  { code: "sk", label: "Slovenčina" },
  { code: "hu", label: "Magyar" },
  { code: "ro", label: "Română" },
  { code: "bg", label: "Български" },
  { code: "el", label: "Ελληνικά" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" },
  { code: "ar", label: "العربية" },
  { code: "he", label: "עברית" },
  { code: "fa", label: "فارسی" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "中文 (简体)" },
  { code: "zh-TW", label: "中文 (繁體)" },
]

type Own = {
  modelValue?: string
  includeDefault?: boolean
  defaultLabel?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "includeDefault",
  "defaultLabel",
  "disabled",
  "class",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** Everything a `<select>` takes (listeners, ARIA, an id) reaches the select. */
export type LanguageSelectProps = Own & Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, keyof Own>

export default function LanguageSelect(raw: LanguageSelectProps) {
  const merged = mergeProps(
    { modelValue: "en", includeDefault: false, defaultLabel: "System default", disabled: false },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)

  const options = createMemo(() =>
    props.includeDefault ? [{ code: "", label: props.defaultLabel }, ...LANGUAGES] : LANGUAGES,
  )

  // Its model listens beside the caller's own `onChange`, never in its place.
  return (
    <select
      aria-label="Language"
      {...rest}
      value={props.modelValue}
      disabled={props.disabled}
      class={cn(
        "min-h-10 w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none",
        props.class,
      )}
      on:change={(e) => props.onUpdateModelValue?.(e.currentTarget.value)}
    >
      <For each={options()}>
        {(lang) => (
          <option value={lang.code} selected={lang.code === props.modelValue}>
            {lang.label}
          </option>
        )}
      </For>
    </select>
  )
}
