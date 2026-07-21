<script setup lang="ts">
import { computed, ref } from "vue"
import { CodeBlock } from "@/shared/ui"
import { docsFramework, setDocsFramework, toSvelteCode } from "./svelte"

const props = defineProps<{ code: string }>()
const tab = ref<"preview" | "code">("preview")

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
          :class="tab === 'preview' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="tab = 'preview'"
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'code'"
          class="border-b pb-2 transition-colors"
          :class="tab === 'code' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
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
          type="button"
          :aria-pressed="docsFramework === 'vue'"
          class="transition-colors"
          :class="chipClass(docsFramework === 'vue')"
          @click="setDocsFramework('vue')"
        >
          Vue
        </button>
        <button
          type="button"
          :aria-pressed="docsFramework === 'svelte'"
          class="transition-colors"
          :class="chipClass(docsFramework === 'svelte')"
          @click="setDocsFramework('svelte')"
        >
          Svelte
        </button>
      </div>
    </div>
    <div
      v-show="tab === 'preview'"
      class="mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-border/60 p-8 sm:p-10"
    >
      <div class="w-full">
        <slot />
      </div>
    </div>
    <div v-show="tab === 'code'" class="mt-3">
      <CodeBlock :code="shownCode" />
    </div>
  </div>
</template>
