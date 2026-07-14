<script setup lang="ts">
import { provide, ref } from "vue"
import { DRAWER_CHANNEL } from "./DitherDrawer.vue"
import { cn } from "./lib"

/** Wrap your app's main UI: it scales back while any root drawer inside is
 * open — the same channel nested drawers use, provided at app level. */
const props = defineProps<{ class?: string }>()

const openCount = ref(0)
provide(DRAWER_CHANNEL, { notify: (d) => (openCount.value += d) })
</script>

<template>
  <div
    :class="
      cn(
        'origin-top transition-[transform,filter,border-radius] duration-200 motion-reduce:transition-none',
        openCount > 0 ? 'scale-[0.98] rounded-xl brightness-75' : '',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
