<script setup lang="ts">
import { cn } from "./lib"

/** Addon slots around a control — prefix/suffix text, icons or buttons in
 * one bordered group. The inner control drops its own chrome (the docs
 * snippet shows the exact class set); the group owns the border and the
 * focus-within ring. */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="
      cn(
        'flex w-full items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 transition-[border-color,box-shadow] focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20 motion-reduce:transition-none',
        props.class,
      )
    "
  >
    <span class="shrink-0 text-[12px] text-muted-foreground"><slot name="prefix" /></span>
    <slot />
    <span class="shrink-0 text-[12px] text-muted-foreground"><slot name="suffix" /></span>
  </div>
</template>
