<script setup lang="ts">
import { computed, inject } from "vue"
import { TABS_CTX } from "./DitherTabs.vue"
import { cn } from "./lib"

/** The panel half of the tabs pattern — id-linked to its tab, kept mounted
 * (v-show) so canvas-heavy content does not repaint on every switch. */
const props = defineProps<{ value: string; class?: string }>()

const ctx = inject(TABS_CTX, null)
const active = computed(() => ctx?.active.value === props.value)
</script>

<template>
  <div
    v-show="active"
    :id="ctx ? `${ctx.idBase}-panel-${props.value}` : undefined"
    role="tabpanel"
    :aria-labelledby="ctx ? `${ctx.idBase}-tab-${props.value}` : undefined"
    :class="cn(props.class)"
  >
    <slot />
  </div>
</template>
