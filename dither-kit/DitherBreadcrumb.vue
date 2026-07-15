<script lang="ts">
export type Crumb = { label: string; href?: string }
</script>

<script setup lang="ts">
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    items: Crumb[]
    separator?: string
    class?: string
  }>(),
  { separator: "/" }
)
</script>

<template>
  <nav aria-label="Breadcrumb" :class="cn('text-[13px]', props.class)">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li v-for="(c, i) in items" :key="i" class="flex items-center gap-1.5">
        <a
          v-if="c.href && i < items.length - 1"
          :href="c.href"
          class="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
          >{{ c.label }}</a
        >
        <span
          v-else
          :aria-current="i === items.length - 1 ? 'page' : undefined"
          :class="i === items.length - 1 ? 'text-foreground' : 'text-muted-foreground'"
          >{{ c.label }}</span
        >
        <span
          v-if="i < items.length - 1"
          aria-hidden="true"
          class="select-none text-muted-foreground/40"
          >{{ props.separator }}</span
        >
      </li>
    </ol>
  </nav>
</template>
