<!-- Generated from ../tailwind/CascadeSelect.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  select: {
    minHeight: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--muted-foreground)" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  text: { color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { cn, type StyleProp } from "./lib"

/** Dependent cascade pickers: a path of native selects where each level's
 * options come from the tree under the current path. Changing a parent
 * truncates the deeper segments (the classic cascade rule). The model is the
 * chosen path — one string per level, deeper entries cleared on change. */
interface CascadeNode {
  value: string
  children?: CascadeNode[]
}

const props = withDefaults(
  defineProps<{
    tree?: CascadeNode[]
    value?: string[]
    placeholders?: string[]
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { tree: () => [], placeholders: () => [], disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>()

const path = ref<string[]>([...(props.value ?? [])])

watch(
  () => props.value,
  (v) => {
    path.value = [...(v ?? [])]
  },
)

function nodesAt(depth: number): CascadeNode[] {
  let level = props.tree
  for (let d = 0; d < depth; d++) {
    const chosen = path.value[d]
    const node = level.find((n) => n.value === chosen)
    if (!node?.children) return []
    level = node.children
  }
  return level
}

const activeDepth = computed(() => {
  let depth = 0
  while (nodesAt(depth).length > 0 && depth < 12) depth++
  return depth
})

function onChange(depth: number, chosen: string) {
  const next = path.value.slice(0, depth)
  next[depth] = chosen
  path.value = next
  emit("update:modelValue", next)
}
</script>

<template>
  <div :class="cn(styles.row, props.xstyle, props.class)">
    <template v-for="depth in activeDepth" :key="depth">
      <select
        :value="path[depth - 1] ?? ''"
        :disabled="props.disabled"
        :aria-label="props.placeholders[depth - 1] ?? `Level ${depth}`"
        v-bind="stylex.attrs(styles.select)"
        @change="onChange(depth - 1, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>
          {{ props.placeholders[depth - 1] ?? `Level ${depth}` }}
        </option>
        <option v-for="node in nodesAt(depth - 1)" :key="node.value" :value="node.value">
          {{ node.value }}
        </option>
      </select>
      <span v-if="depth < activeDepth" aria-hidden="true" v-bind="stylex.attrs(styles.text)">/</span>
    </template>
  </div>
</template>
