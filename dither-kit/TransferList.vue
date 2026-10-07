<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

/** Two-panel transfer shuttle: the source pool stays put, the destination IS
 * the model. Native checkboxes select in both directions, Add/Remove move the
 * selection, Add all/Remove all flush. Everything keyboard-reachable. */
const props = withDefaults(
  defineProps<{
    source?: string[]
    value?: string[]
    disabled?: boolean
    sourceLabel?: string
    targetLabel?: string
    class?: string
  }>(),
  {
    source: () => [],
    sourceLabel: "Available",
    targetLabel: "Selected",
    disabled: false,
  },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>()

const sourceSel = ref<Set<string>>(new Set())
const targetSel = ref<Set<string>>(new Set())

const target = computed(() => props.value ?? [])
const available = computed(() => props.source.filter((s) => !target.value.includes(s)))

function toggle(side: "source" | "target", item: string, checked: boolean) {
  const held = side === "source" ? sourceSel : targetSel
  const next = new Set(held.value)
  if (checked) next.add(item)
  else next.delete(item)
  held.value = next
}

function add() {
  emit("update:modelValue", [...target.value, ...sourceSel.value])
  sourceSel.value = new Set()
}
function remove() {
  emit("update:modelValue", target.value.filter((t) => !targetSel.value.has(t)))
  targetSel.value = new Set()
}
function addAll() {
  emit("update:modelValue", [...target.value, ...available.value])
  sourceSel.value = new Set()
}
function removeAll() {
  emit("update:modelValue", [])
  targetSel.value = new Set()
}

const panelClass =
  "grid min-h-32 content-start gap-0.5 overflow-auto rounded-md border border-border bg-background/60 p-1"
const rowClass =
  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/10 motion-reduce:transition-none"
const btnClass =
  "rounded border border-border/70 px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr]" :class="cn(props.class)">
    <div>
      <p class="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {{ props.sourceLabel }}
      </p>
      <ul :class="panelClass" :aria-disabled="props.disabled || undefined">
        <li v-if="available.length === 0" class="px-2 py-1.5 text-[12px] text-muted-foreground">
          Nothing left
        </li>
        <li v-for="item in available" :key="item">
          <label :class="rowClass">
            <input
              type="checkbox"
              class="size-3.5 accent-[currentColor]"
              :checked="sourceSel.has(item)"
              :disabled="props.disabled"
              @change="toggle('source', item, ($event.target as HTMLInputElement).checked)"
            />
            {{ item }}
          </label>
        </li>
      </ul>
    </div>

    <div class="flex flex-row justify-center gap-1.5 sm:flex-col sm:justify-center">
      <button type="button" :class="btnClass" :disabled="props.disabled || sourceSel.size === 0" @click="add">
        Add →
      </button>
      <button type="button" :class="btnClass" :disabled="props.disabled || targetSel.size === 0" @click="remove">
        ← Remove
      </button>
      <button type="button" :class="btnClass" :disabled="props.disabled || available.length === 0" @click="addAll">
        Add all
      </button>
      <button type="button" :class="btnClass" :disabled="props.disabled || target.length === 0" @click="removeAll">
        Remove all
      </button>
    </div>

    <div>
      <p class="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {{ props.targetLabel }}
      </p>
      <ul :class="panelClass" :aria-disabled="props.disabled || undefined">
        <li v-if="target.length === 0" class="px-2 py-1.5 text-[12px] text-muted-foreground">
          Empty
        </li>
        <li v-for="item in target" :key="item">
          <label :class="rowClass">
            <input
              type="checkbox"
              class="size-3.5 accent-[currentColor]"
              :checked="targetSel.has(item)"
              :disabled="props.disabled"
              @change="toggle('target', item, ($event.target as HTMLInputElement).checked)"
            />
            {{ item }}
          </label>
        </li>
      </ul>
    </div>
  </div>
</template>
