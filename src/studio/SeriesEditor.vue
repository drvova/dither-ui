<script setup lang="ts">
import { COLORS, replay, rows, studio } from "./store"

const isPie = () => studio.type === "pie"
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      v-for="row in rows"
      :key="row.key"
      class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
      :class="row.on ? 'bg-background/40' : 'opacity-45'"
    >
      <button
        type="button"
        class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border"
        :class="row.on ? 'border-foreground bg-foreground text-background' : 'border-border'"
        :aria-label="`Toggle ${row.label}`"
        @click="row.on = !row.on; replay()"
      >
        <svg v-if="row.on" viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M5 12l5 5L20 6" />
        </svg>
      </button>
      <span class="w-16 shrink-0 truncate text-xs text-foreground">{{ row.label }}</span>
      <div class="ml-auto flex gap-1">
        <button
          v-for="c in COLORS"
          :key="c"
          type="button"
          class="size-4 rounded-[3px] border transition-transform hover:scale-110"
          :class="row.color === c ? 'border-foreground' : 'border-transparent'"
          :style="{ backgroundColor: `var(--swatch-${c})` }"
          :title="c"
          :aria-label="c"
          @click="row.color = c"
        />
      </div>
    </div>
    <p v-if="isPie()" class="px-2 pt-1 text-[10px] text-muted-foreground">
      toggling a slice filters it from the data.
    </p>
  </div>
</template>
