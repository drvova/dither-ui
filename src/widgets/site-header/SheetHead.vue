<script setup lang="ts">
// A full-screen sheet's head (the menu, the docs' sections): the header
// itself, standing where it stood, so opening a sheet moves nothing but
// the key that opened it, which turns to "Close" in its place under the
// close mark, an X in the brand's pixel. What the
// sheet is may stand in the middle (`default` slot). The close key is the
// sheet's first stop.
import BrandMark from "@/shared/ui/BrandMark.vue"
import { CLOSE_CELLS, SHEET_HEAD_FOOT } from "./menu"

/** The close key's full name: "Close menu", "Close sections". */
const props = defineProps<{ closeLabel: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="site-head sheet-head" :style="{ paddingBottom: `${SHEET_HEAD_FOOT}px` }">
    <div class="site-capsule text-xs">
      <span class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2">
        <BrandMark :size="13" /><span class="max-[359px]:sr-only">dither-ui</span>
      </span>
      <slot />
      <button type="button" class="nav-a menu-key" :aria-label="props.closeLabel" autofocus @click="emit('close')">
        <BrandMark :cells="CLOSE_CELLS" :size="14" />
        <span class="max-[359px]:sr-only" aria-hidden="true">Close</span>
      </button>
    </div>
  </div>
</template>
