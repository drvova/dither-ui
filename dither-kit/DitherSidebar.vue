<script lang="ts">
import type { InjectionKey, Ref } from "vue"

export type SidebarVariant = "default" | "floating" | "inset" | "washed"
export type SidebarCollapse = "rail" | "hide" | "none"
export type SidebarDensity = "default" | "compact"

/** True while the sidebar is showing its icon rail — items fold their labels. */
export const SIDEBAR_COLLAPSED: InjectionKey<Ref<boolean>> = Symbol("dither-sidebar")
/** True when the sidebar asked its items for compact rows. */
export const SIDEBAR_COMPACT: InjectionKey<Ref<boolean>> = Symbol("dither-sidebar-density")
</script>

<script setup lang="ts">
import { computed, provide } from "vue"
import DitherGradient from "./DitherGradient.vue"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

const props = withDefaults(
  defineProps<{
    /** Collapsed state (v-model). Meaning depends on `collapse` mode. */
    modelValue?: boolean
    label?: string
    /** default: edge panel · floating: detached card · inset: bare · washed: dither gradient chrome. */
    variant?: SidebarVariant
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    /** rail: folds to icons · hide: folds away entirely · none: no toggle. */
    collapse?: SidebarCollapse
    /** compact tightens rows — dense trees, inspector panels. */
    density?: SidebarDensity
    /** Hide the built-in rail toggle (permanent rail: collapse="rail" + :model-value="true"). */
    toggle?: boolean
    /** Wash color for variant="washed". */
    washColor?: PixelColor
    class?: string
  }>(),
  {
    modelValue: false,
    label: "Sidebar",
    variant: "default",
    side: "left",
    collapse: "rail",
    density: "default",
    toggle: true,
    washColor: "blue",
  }
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()

/** Items only fold labels in rail mode — a hidden sidebar keeps full labels. */
const railCollapsed = computed(() => props.collapse === "rail" && props.modelValue)
provide(SIDEBAR_COLLAPSED, railCollapsed)
provide(SIDEBAR_COMPACT, computed(() => props.density === "compact"))

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
  const edge = props.side === "right" ? "border-l" : "border-r"
  if (props.variant === "washed")
    return `relative isolate overflow-hidden ${edge} border-border/60`
  return `${edge} border-border/60 bg-background/40`
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
    <DitherGradient
      v-if="props.variant === 'washed' && !hidden"
      :from="props.washColor"
      to="transparent"
      direction="up"
      :opacity="0.12"
      :cell="4"
      class="-z-10"
    />
    <slot name="header" />
    <nav class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
      <slot />
    </nav>
    <slot name="footer" />
    <button
      v-if="props.collapse === 'rail' && props.toggle"
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
