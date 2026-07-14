<script lang="ts">
import type { InjectionKey, Ref } from "vue"

export const SIDEBAR_COLLAPSED: InjectionKey<Ref<boolean>> = Symbol("dither-sidebar")
</script>

<script setup lang="ts">
import { computed, provide } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    /** Collapsed = icon rail. */
    modelValue?: boolean
    label?: string
    class?: string
  }>(),
  { modelValue: false, label: "Sidebar" }
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()

const collapsed = computed(() => props.modelValue)
provide(SIDEBAR_COLLAPSED, collapsed)
</script>

<template>
  <aside
    :aria-label="props.label"
    :class="
      cn(
        'flex h-full shrink-0 flex-col border-r border-border/60 bg-background/40 p-2 transition-[width] duration-200 motion-reduce:transition-none',
        collapsed ? 'w-14' : 'w-56',
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
      type="button"
      class="mt-2 flex h-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :aria-expanded="!collapsed"
      @click="emit('update:modelValue', !collapsed)"
    >
      <span class="text-[13px]" aria-hidden="true">{{ collapsed ? "›" : "‹" }}</span>
    </button>
  </aside>
</template>
