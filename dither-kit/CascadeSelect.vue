<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { cn } from "./lib"

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
  }>(),
  { tree: () => [], placeholders: () => [], disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>()

const path = ref<string[]>([...props.value ?? []])

watch(
  () => props.value,
  (v) => {
    path.value = [...v ?? []]
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
  <div class="flex flex-wrap items-center gap-2" :class="cn(props.class)">
    <template v-for="depth in activeDepth" :key="depth">
      <select
        :value="path[depth - 1] ?? ''"
        :disabled="props.disabled"
        :aria-label="props.placeholders[depth - 1] ?? `Level ${depth}`"
        class="min-h-10 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 hover:border-foreground/25 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
        @change="onChange(depth - 1, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>
          {{ props.placeholders[depth - 1] ?? `Level ${depth}` }}
        </option>
        <option v-for="node in nodesAt(depth - 1)" :key="node.value" :value="node.value">
          {{ node.value }}
        </option>
      </select>
      <span v-if="depth < activeDepth" aria-hidden="true" class="text-muted-foreground">/</span>
    </template>
  </div>
</template>
