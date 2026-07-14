<script setup lang="ts">
import { ref } from "vue"
import { CodeBlock } from "@/shared/ui"

defineProps<{ code: string }>()
const tab = ref<"preview" | "code">("preview")
</script>

<template>
  <div class="mt-6">
    <div class="flex gap-4 text-[12px]" role="tablist">
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
      v-show="tab === 'preview'"
      class="mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-border/60 p-8 sm:p-10"
    >
      <div class="w-full">
        <slot />
      </div>
    </div>
    <div v-show="tab === 'code'" class="mt-3">
      <CodeBlock :code="code" />
    </div>
  </div>
</template>
