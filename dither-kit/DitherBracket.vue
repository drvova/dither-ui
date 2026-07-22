<script lang="ts">
export type BracketMatch = { a: string; b: string; winner?: "a" | "b" }
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "./palette"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Knockout bracket — columns of matches with connector rails between
 * rounds. Winners carry the accent; when interactive, clicking a side
 * reports the pick and the consumer advances the data. */
const props = withDefaults(
  defineProps<{
    /** rounds[r] is the list of matches in round r, left to right. */
    rounds: BracketMatch[][]
    color?: PixelColor
    /** Enables picking winners by click. */
    interactive?: boolean
    class?: string
  }>(),
  { color: "green", interactive: false }
)
const emit = defineEmits<{ pick: [round: number, match: number, side: "a" | "b"] }>()

const accent = computed(() => cssColor(props.color))

const sideClass = (m: BracketMatch, side: "a" | "b") =>
  cn(
    "flex h-7 min-w-0 items-center gap-2 px-2.5 text-left text-[11px] transition-colors",
    m.winner === side ? "text-foreground" : m.winner ? "text-muted-foreground/50 line-through" : "text-muted-foreground",
    props.interactive && !m.winner && "cursor-pointer hover:bg-card/60 hover:text-foreground"
  )
</script>

<template>
  <div :class="cn('flex items-stretch gap-6 overflow-x-auto font-mono', props.class)" role="group" aria-label="Tournament bracket">
    <div v-for="(round, r) in props.rounds" :key="r" class="flex min-w-36 flex-col justify-around gap-3">
      <div v-for="(m, i) in round" :key="i" class="relative">
        <div class="overflow-hidden rounded-md border border-border/60 bg-background/60">
          <component
            :is="props.interactive && !m.winner ? 'button' : 'div'"
            :type="props.interactive && !m.winner ? 'button' : undefined"
            :class="cn(sideClass(m, 'a'), 'w-full border-b border-border/40', CONTROL_BUTTON)"
            @click="props.interactive && !m.winner && emit('pick', r, i, 'a')"
          >
            <span
              aria-hidden="true"
              class="size-1.5 shrink-0 rounded-[1px]"
              :style="{ background: m.winner === 'a' ? accent : 'var(--border)' }"
            />
            <span class="min-w-0 flex-1 truncate">{{ m.a }}</span>
            <span v-if="m.winner === 'a'" class="sr-only">winner</span>
          </component>
          <component
            :is="props.interactive && !m.winner ? 'button' : 'div'"
            :type="props.interactive && !m.winner ? 'button' : undefined"
            :class="cn(sideClass(m, 'b'), 'w-full', CONTROL_BUTTON)"
            @click="props.interactive && !m.winner && emit('pick', r, i, 'b')"
          >
            <span
              aria-hidden="true"
              class="size-1.5 shrink-0 rounded-[1px]"
              :style="{ background: m.winner === 'b' ? accent : 'var(--border)' }"
            />
            <span class="min-w-0 flex-1 truncate">{{ m.b }}</span>
            <span v-if="m.winner === 'b'" class="sr-only">winner</span>
          </component>
        </div>
        <span
          v-if="r < props.rounds.length - 1"
          aria-hidden="true"
          class="absolute top-1/2 -right-6 h-px w-6 bg-border/60"
        />
      </div>
    </div>
  </div>
</template>
