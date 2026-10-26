<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

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
    :class="
      cn(
        'min-h-10 w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none',
        props.class,
      )
    "
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="lang in options" :key="lang.code || '(default)'" :value="lang.code">
      {{ lang.label }}
    </option>
  </select>
</template>
