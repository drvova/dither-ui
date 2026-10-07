<script setup lang="ts">
import { ref } from "vue"

const props = defineProps<{ code: string }>()
const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1400)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div
    class="relative rounded-lg border border-transparent bg-background/60 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
  >
    <!-- Right gutter reserved under the chip (pr on the pre) plus this fade:
         horizontal overflow on phones had zero affordance — lines just ran
         off the screen under a translucent chip. -->
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-lg bg-gradient-to-l from-background to-transparent"
      aria-hidden="true"
    />
    <button
      type="button"
      class="absolute right-2 top-2 z-10 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      @click="copy"
    >
      {{ copied ? "copied" : "copy" }}
    </button>
    <pre class="overflow-x-auto touch-pan-x p-4 pr-16 font-mono text-[12px] leading-relaxed text-foreground"><code>{{ code }}</code></pre>
  </div>
</template>
