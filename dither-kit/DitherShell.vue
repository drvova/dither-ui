<script setup lang="ts">
import { useSlots } from "vue"
import { cn } from "./lib"

/** App frame: topbar over an aside + content pair, optional statusbar under.
 * Regions render only when their slot is filled — the grid adapts. */
const props = withDefaults(
  defineProps<{
    /** true draws the embedded card chrome — border, rounding, clip. */
    frame?: boolean
    class?: string
  }>(),
  { frame: false }
)
const slots = useSlots()
</script>

<template>
  <div
    :class="
      cn(
        'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-background text-foreground',
        props.frame && 'overflow-hidden rounded-lg border border-border/60',
        props.class
      )
    "
  >
    <header v-if="slots.topbar" class="flex items-center border-b border-border/60">
      <slot name="topbar" />
    </header>
    <div v-else aria-hidden="true" />
    <div class="grid min-h-0 grid-cols-[auto_minmax(0,1fr)]">
      <slot name="aside" />
      <main :class="cn('min-h-0 min-w-0', !slots.aside && 'col-span-2')">
        <slot />
      </main>
    </div>
    <footer v-if="slots.statusbar" class="flex items-center border-t border-border/60">
      <slot name="statusbar" />
    </footer>
    <div v-else aria-hidden="true" />
  </div>
</template>
