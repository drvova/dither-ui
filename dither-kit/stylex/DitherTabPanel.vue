<!-- Generated from ../tailwind/DitherTabPanel.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { computed, inject } from "vue"
import { TABS_CTX } from "./DitherTabs.vue"
import { cn, type StyleProp } from "./lib"

/** The panel half of the tabs pattern — id-linked to its tab, kept mounted
 * (v-show) so canvas-heavy content does not repaint on every switch. */
const props = defineProps<{ value: string; class?: string; xstyle?: StyleProp }>()

const ctx = inject(TABS_CTX, null)
const active = computed(() => ctx?.active.value === props.value)
</script>

<template>
  <div
    v-show="active"
    :id="ctx ? `${ctx.idBase}-panel-${props.value}` : undefined"
    role="tabpanel"
    :aria-labelledby="ctx ? `${ctx.idBase}-tab-${props.value}` : undefined"
    :class="cn(props.xstyle, props.class)"
  >
    <slot />
  </div>
</template>
