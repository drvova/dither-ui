<script setup lang="ts">
import { DitherIcon } from "@dither-kit"
import { NAV_LINK, type PagePart } from "./DocsNav.vue"

/** On this page (the rail right of the content at xl): the parts of the
 * section in view, each a button that scrolls to it, the first (the
 * section's heading) marked. Under lg the sections sheet lists them under
 * the section's link. */
const props = defineProps<{ parts: PagePart[] }>()
const emit = defineEmits<{ go: [el: HTMLElement] }>()
</script>

<template>
  <nav aria-label="On this page">
    <p class="flex items-center gap-2 text-[11px] font-medium text-foreground">
      <DitherIcon name="Menu" :size="13" :stroke-width="1.5" />On this page
    </p>
    <ul class="mt-2.5 grid gap-0.5 border-l border-border/60">
      <li v-for="(p, i) in props.parts" :key="i">
        <button
          type="button"
          class="-ml-px block w-full border-l pl-3 text-left transition-colors hover:border-foreground/40 hover:text-foreground"
          :class="[
            NAV_LINK.rail,
            i === 0 ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground',
          ]"
          @click="emit('go', p.el)"
        >
          {{ p.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>
