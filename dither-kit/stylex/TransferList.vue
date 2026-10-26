<!-- Generated from ../tailwind/TransferList.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: { default: null, "@media (width >= 40rem)": "1fr auto 1fr" },
  },
  p: {
    marginBottom: "0.25rem",
    fontSize: "11px",
    letterSpacing: "0.05em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  li: {
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  input: { width: "0.875rem", height: "0.875rem", accentColor: "currentColor" },
  row: {
    display: "flex",
    flexDirection: { default: "row", "@media (width >= 40rem)": "column" },
    justifyContent: { default: "center", "@media (width >= 40rem)": "center" },
    gap: "0.375rem",
  },
  panelClass: {
    display: "grid",
    minHeight: "8rem",
    alignContent: "flex-start",
    gap: "0.125rem",
    overflow: "auto",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.25rem",
  },
  rowClass: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "13px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  btnClass: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 40%, transparent)",
      },
    },
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"

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
    xstyle?: StyleProp
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
  emit(
    "update:modelValue",
    target.value.filter((t) => !targetSel.value.has(t)),
  )
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

const panelClass = styles.panelClass
const rowClass = styles.rowClass
const btnClass = styles.btnClass
</script>

<template>
  <div :class="cn(styles.grid, props.xstyle, props.class)">
    <div>
      <p v-bind="stylex.attrs(styles.p)">
        {{ props.sourceLabel }}
      </p>
      <ul :class="cn(panelClass)" :aria-disabled="props.disabled || undefined">
        <li v-if="available.length === 0" v-bind="stylex.attrs(styles.li)">Nothing left</li>
        <li v-for="item in available" :key="item">
          <label :class="cn(rowClass)">
            <input
              type="checkbox"
              v-bind="stylex.attrs(styles.input)"
              :checked="sourceSel.has(item)"
              :disabled="props.disabled"
              @change="toggle('source', item, ($event.target as HTMLInputElement).checked)"
            />
            {{ item }}
          </label>
        </li>
      </ul>
    </div>

    <div v-bind="stylex.attrs(styles.row)">
      <button type="button" :class="cn(btnClass)" :disabled="props.disabled || sourceSel.size === 0" @click="add">
        Add →
      </button>
      <button type="button" :class="cn(btnClass)" :disabled="props.disabled || targetSel.size === 0" @click="remove">
        ← Remove
      </button>
      <button type="button" :class="cn(btnClass)" :disabled="props.disabled || available.length === 0" @click="addAll">
        Add all
      </button>
      <button type="button" :class="cn(btnClass)" :disabled="props.disabled || target.length === 0" @click="removeAll">
        Remove all
      </button>
    </div>

    <div>
      <p v-bind="stylex.attrs(styles.p)">
        {{ props.targetLabel }}
      </p>
      <ul :class="cn(panelClass)" :aria-disabled="props.disabled || undefined">
        <li v-if="target.length === 0" v-bind="stylex.attrs(styles.li)">Empty</li>
        <li v-for="item in target" :key="item">
          <label :class="cn(rowClass)">
            <input
              type="checkbox"
              v-bind="stylex.attrs(styles.input)"
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
