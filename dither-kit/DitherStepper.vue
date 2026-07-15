<script lang="ts">
export type Step = { label: string; hint?: string }
</script>

<script setup lang="ts">
import { cn } from "./lib"
import DitherSeparator from "./DitherSeparator.vue"

const props = withDefaults(
  defineProps<{
    steps: Step[]
    current: number // index of the active step
    class?: string
  }>(),
  {}
)

const state = (i: number) => (i < props.current ? "done" : i === props.current ? "active" : "todo")
</script>

<template>
  <ol :class="cn('flex items-start', props.class)" role="list" aria-label="Progress">
    <li
      v-for="(s, i) in steps"
      :key="i"
      class="flex flex-1 flex-col items-center"
      :aria-current="i === current ? 'step' : undefined"
    >
      <div class="flex w-full items-center">
        <DitherSeparator v-if="i > 0" class="flex-1" :class="state(i) === 'todo' ? 'opacity-30' : ''" />
        <span v-else class="flex-1" />
        <span
          :class="
            cn(
              'inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums transition-colors',
              state(i) === 'done' && 'border-foreground/30 bg-foreground/10 text-foreground',
              state(i) === 'active' && 'border-foreground bg-background text-foreground',
              state(i) === 'todo' && 'border-border text-muted-foreground'
            )
          "
        >
          <svg v-if="state(i) === 'done'" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 12l5 5L20 7" />
          </svg>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <DitherSeparator
          v-if="i < steps.length - 1"
          class="flex-1"
          :class="state(i + 1) === 'todo' && state(i) !== 'active' ? 'opacity-30' : state(i) === 'todo' ? 'opacity-30' : ''"
        />
        <span v-else class="flex-1" />
      </div>
      <span
        :class="
          cn('mt-2 text-center text-[12px]', i === current ? 'text-foreground' : 'text-muted-foreground')
        "
        >{{ s.label }}</span
      >
      <span v-if="s.hint" class="text-center text-[11px] text-muted-foreground/60">{{ s.hint }}</span>
    </li>
  </ol>
</template>
