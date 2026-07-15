<script lang="ts">
/** Compact page list with ellipsis anchors — always shows first, last, the
 * current page and `siblings` on each side, collapsing the rest to "…". */
export function pageList(page: number, total: number, siblings = 1): (number | "…")[] {
  const range = (s: number, e: number) => Array.from({ length: e - s + 1 }, (_, i) => s + i)
  const slots = siblings * 2 + 5
  if (total <= slots) return range(1, total)
  const left = Math.max(page - siblings, 1)
  const right = Math.min(page + siblings, total)
  const leftDots = left > 2
  const rightDots = right < total - 1
  if (!leftDots && rightDots) return [...range(1, 3 + siblings * 2), "…", total]
  if (leftDots && !rightDots) return [1, "…", ...range(total - (2 + siblings * 2), total)]
  return [1, "…", ...range(left, right), "…", total]
}
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    page: number
    total: number
    siblings?: number
    class?: string
  }>(),
  { siblings: 1 }
)
const emit = defineEmits<{ (e: "update:page", v: number): void }>()

const pages = computed(() => pageList(props.page, props.total, props.siblings))
const go = (p: number) => {
  const next = Math.min(Math.max(p, 1), props.total)
  if (next !== props.page) emit("update:page", next)
}

const cellBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] tabular-nums transition-colors"
</script>

<template>
  <nav aria-label="Pagination" :class="cn('flex items-center gap-1', props.class)">
    <button
      type="button"
      :class="cn(cellBase, 'border-border text-muted-foreground hover:text-foreground disabled:opacity-40')"
      :disabled="page <= 1"
      aria-label="Previous page"
      @click="go(page - 1)"
    >
      ‹
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <span
        v-if="p === '…'"
        aria-hidden="true"
        class="inline-flex h-8 min-w-8 items-center justify-center text-[12px] text-muted-foreground/50"
        >…</span
      >
      <button
        v-else
        type="button"
        :class="
          cn(
            cellBase,
            p === page
              ? 'border-foreground/30 bg-card text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground'
          )
        "
        :aria-current="p === page ? 'page' : undefined"
        :aria-label="`Page ${p}`"
        @click="go(p as number)"
      >
        {{ p }}
      </button>
    </template>
    <button
      type="button"
      :class="cn(cellBase, 'border-border text-muted-foreground hover:text-foreground disabled:opacity-40')"
      :disabled="page >= total"
      aria-label="Next page"
      @click="go(page + 1)"
    >
      ›
    </button>
  </nav>
</template>
