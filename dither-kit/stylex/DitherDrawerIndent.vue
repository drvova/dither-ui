<!-- Generated from ../tailwind/DitherDrawerIndent.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    transformOrigin: "top",
    transitionProperty: {
      default: "transform, filter, border-radius",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  scale098: { scale: "0.98", borderRadius: "0.75rem", filter: " brightness(75%)       " },
})
</script>

<script setup lang="ts">
import { provide, ref } from "vue"
import { DRAWER_CHANNEL } from "./DitherDrawer.vue"
import { cn, type StyleProp } from "./lib"

/** Wrap your app's main UI: it scales back while any root drawer inside is
 * open — the same channel nested drawers use, provided at app level. */
const props = defineProps<{ class?: string; xstyle?: StyleProp }>()

const openCount = ref(0)
provide(DRAWER_CHANNEL, { notify: (d) => (openCount.value += d) })
</script>

<template>
  <div :class="cn(styles.box, openCount > 0 ? styles.scale098 : null, props.xstyle, props.class)">
    <slot />
  </div>
</template>
