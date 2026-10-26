<!-- Generated from ../tailwind/LanguageSelect.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
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
      ":focus-visible": "color-mix(in oklab, var(--accent) 70%, transparent)",
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
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(2px + 0px) color-mix(in oklab, var(--accent) 20%, transparent)",
    },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

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

const props = withDefaults(
  defineProps<{
    modelValue?: string
    includeDefault?: boolean
    defaultLabel?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { modelValue: "en", includeDefault: false, defaultLabel: "System default", disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const options = computed(() =>
  props.includeDefault ? [{ code: "", label: props.defaultLabel }, ...LANGUAGES] : LANGUAGES,
)
</script>

<template>
  <select
    :value="props.modelValue"
    :disabled="props.disabled"
    :class="cn(styles.select, props.xstyle, props.class)"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="lang in options" :key="lang.code || '(default)'" :value="lang.code">
      {{ lang.label }}
    </option>
  </select>
</template>
