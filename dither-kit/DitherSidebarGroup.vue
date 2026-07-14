<script setup lang="ts">
import { inject, ref } from "vue"
import { SIDEBAR_COLLAPSED } from "./DitherSidebar.vue"

/** Labelled cluster of sidebar items. On the icon rail the label folds into
 * a hairline separator so the grouping survives the collapse. */
const props = defineProps<{ label?: string }>()

const collapsed = inject(SIDEBAR_COLLAPSED, ref(false))
</script>

<template>
  <div class="mt-4 first:mt-0" role="group" :aria-label="props.label">
    <div
      v-if="props.label && !collapsed"
      class="px-2.5 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70"
    >
      {{ props.label }}
    </div>
    <div v-else-if="props.label && collapsed" aria-hidden="true" class="mx-2.5 mb-1.5 h-px bg-border/60" />
    <div class="grid gap-0.5">
      <slot />
    </div>
  </div>
</template>
