<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { CodeBlock } from "@/shared/ui"
import { docsFramework, setDocsFramework, toSvelteCode } from "./svelte"

const props = defineProps<{ code: string }>()
const tab = ref<"preview" | "code">("preview")
const host = ref<HTMLElement | null>(null)

// Mount the heavy slot (canvases, charts, whole demo trees) only as the card
// approaches the viewport — and latch: once revealed it stays, so interaction
// state inside a demo never resets on scroll. Falls back to always-on without
// IntersectionObserver (jsdom included), keeping tests and ancient engines on
// the old behaviour. The preview frame keeps min-h-[280px], so the box exists
// from first paint and below-fold growth never shifts visible content.
const revealed = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver === "undefined" || !host.value) {
    revealed.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        revealed.value = true
        io?.disconnect()
        io = null
      }
    },
    { rootMargin: "600px" },
  )
  io.observe(host.value)
})
onBeforeUnmount(() => io?.disconnect())

const shownCode = computed(() =>
  docsFramework.value === "svelte" ? toSvelteCode(props.code) : props.code,
)

const chipClass = (active: boolean) =>
  active
    ? "rounded border border-border/60 px-2 py-0.5 text-foreground"
    : "rounded border border-transparent px-2 py-0.5 text-muted-foreground hover:text-foreground"
</script>

<template>
  <div class="mt-6">
    <div class="flex items-center justify-between text-[12px]">
      <div class="flex gap-4" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'preview'"
          class="border-b pb-2 transition-colors"
          :class="tab === 'preview' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'"
          @click="tab = 'preview'"
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'code'"
          class="border-b pb-2 transition-colors"
          :class="tab === 'code' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'"
          @click="tab = 'code'"
        >
          Code
        </button>
      </div>
      <div
        v-if="tab === 'code'"
        class="flex gap-1 pb-2 text-[11px]"
        role="group"
        aria-label="Framework"
      >
        <button
          :aria-pressed="docsFramework === 'vue'"
          :class="chipClass(docsFramework === 'vue')"
          @click="setDocsFramework('vue')"
        >
          Vue
        </button>
        <button
          :aria-pressed="docsFramework === 'svelte'"
          :class="chipClass(docsFramework === 'svelte')"
          @click="setDocsFramework('svelte')"
        >
          Svelte
        </button>
      </div>
    </div>
    <div
      v-show="tab === 'preview'"
      ref="host"
      class="mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-border/60 p-8 sm:p-10"
    >
      <div class="w-full">
        <slot v-if="revealed" />
      </div>
    </div>
    <!-- Highlighted code mounts only when its tab is first opened: under the
         old v-show, every one of the page's ~150 hidden CodeBlocks ran at
         initial mount. -->
    <div v-show="tab === 'code'" class="mt-3">
      <CodeBlock v-if="tab === 'code'" :code="shownCode" />
    </div>
  </div>
</template>
