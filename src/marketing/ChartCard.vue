<script setup lang="ts">
defineProps<{ title: string; subtitle: string; tag?: string }>()
</script>

<template>
  <div
    class="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card/40 p-5 transition-colors hover:border-foreground/25"
  >
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-mono text-sm text-foreground">{{ title }}</h3>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ subtitle }}</p>
      </div>
      <span
        v-if="tag"
        class="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
      >
        {{ tag }}
      </span>
    </div>
    <div class="relative h-56 w-full">
      <slot />
    </div>
  </div>
</template>
