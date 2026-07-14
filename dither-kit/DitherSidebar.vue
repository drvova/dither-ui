<script lang="ts">
import type { InjectionKey, Ref } from "vue"

export type SidebarVariant = "default" | "floating" | "inset"
export type SidebarCollapse = "rail" | "hide" | "none"

/** True while the sidebar is showing its icon rail — items fold their labels. */
export const SIDEBAR_COLLAPSED: InjectionKey<Ref<boolean>> = Symbol("dither-sidebar")
</script>

<script setup lang="ts">
import { computed, provide } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    /** Collapsed state (v-model). Meaning depends on `collapse` mode. */
    modelValue?: boolean
    label?: string
    /** default: edge panel · floating: detached card · inset: bare, no chrome. */
    variant?: SidebarVariant
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    /** rail: folds to icons · hide: folds away entirely · none: no toggle. */
    collapse?: SidebarCollapse
    class?: string
  }>(),
  { modelValue: false, label: "Sidebar", variant: "default", side: "left", collapse: "rail" }
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()

/** Items only fold labels in rail mode — a hidden sidebar keeps full labels. */
const railCollapsed = computed(() => props.collapse === "rail" && props.modelValue)
provide(SIDEBAR_COLLAPSED, railCollapsed)

const hidden = computed(() => props.collapse === "hide" && props.modelValue)

const width = computed(() => {
  if (hidden.value) return "w-0 overflow-hidden border-transparent p-0"
  if (railCollapsed.value) return "w-14"
  return "w-56"
})

const chrome = computed(() => {
  if (props.variant === "floating")
    return "m-2 h-[calc(100%-1rem)] rounded-lg border border-border/60 bg-card/50"
  if (props.variant === "inset") return "bg-transparent"
  return props.side === "right"
    ? "border-l border-border/60 bg-background/40"
    : "border-r border-border/60 bg-background/40"
})
</script>

<template>
  <aside
    :aria-label="props.label"
    :class="
      cn(
        'flex h-full shrink-0 flex-col p-2 transition-[width] duration-200 motion-reduce:transition-none',
        chrome,
        width,
        props.class
      )
    "
  >
    <slot name="header" />
    <nav class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
      <slot />
    </nav>
    <slot name="footer" />
    <button
      v-if="props.collapse === 'rail'"
      type="button"
      class="mt-2 flex h-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      :aria-label="railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :aria-expanded="!railCollapsed"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span class="text-[13px]" aria-hidden="true">{{
        railCollapsed ? (props.side === "right" ? "‹" : "›") : props.side === "right" ? "›" : "‹"
      }}</span>
    </button>
  </aside>
</template>
