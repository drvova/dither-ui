// Generated from ../solid/LanguageSelect.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, For, type JSX, mergeProps, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  select: {
    minHeight: "2.5rem",
    width: "100%",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
})

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
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "includeDefault",
  "defaultLabel",
  "disabled",
  "class",
  "xstyle",
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
      class={cn(styles.select, props.xstyle, props.class)}
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
