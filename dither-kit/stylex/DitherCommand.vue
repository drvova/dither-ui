<!-- Generated from ../tailwind/DitherCommand.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type CommandItem = { value: string; label: string; group?: string; kbd?: string }
let commandCount = 0

const styles = stylex.create({
  grid: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    display: "grid",
    placeItems: "start",
    justifyContent: "center",
    paddingTop: "18vh",
  },
  layer: {
    position: "absolute",
    inset: "0px",
    backgroundColor: "color-mix(in oklab, var(--background) 70%, transparent)",
    WebkitBackdropFilter: "blur(2px)        ",
    backdropFilter: "blur(2px)        ",
  },
  frame: {
    position: "relative",
    width: "min(92vw, 480px)",
    overflow: "hidden",
    fontFamily: "var(--font-mono)",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.75rem",
  },
  text: { fontSize: "12px", color: "var(--muted-foreground)" },
  input: {
    height: "2.75rem",
    width: "100%",
    backgroundColor: "transparent",
    fontSize: "13px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "color-mix(in oklab, var(--muted-foreground) 60%, transparent)" },
  },
  text2: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "9px",
    color: "var(--muted-foreground)",
  },
  ul: { maxHeight: "18rem", overflowY: "auto", padding: "0.375rem" },
  li: {
    paddingInline: "0.625rem",
    paddingBlock: "1.5rem",
    textAlign: "center",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  li2: {
    paddingInline: "0.625rem",
    paddingTop: "0.5rem",
    paddingBottom: "0.25rem",
    fontSize: "9px",
    letterSpacing: "0.2em",
    color: "color-mix(in oklab, var(--muted-foreground) 60%, transparent)",
    textTransform: "uppercase",
  },
  li3: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.625rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.5rem",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgCard: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  text3: {
    width: "0.375rem",
    height: "0.375rem",
    flexShrink: "0",
    borderRadius: "1px",
    backgroundColor: "currentcolor",
    opacity: "60%",
  },
  text4: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  kbd: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "9px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
})
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { CONTROL_BUTTON, POPOVER } from "./control"
import { cn, type StyleProp } from "./lib"

/** Command palette — type to filter, arrows to walk, Enter runs, Escape
 * leaves. Same open/close contract as the dialog; wire your own hotkey:
 * `window.addEventListener("keydown", e => e.metaKey && e.key === "k" && open())`. */
const props = withDefaults(
  defineProps<{
    open: boolean
    items: CommandItem[]
    placeholder?: string
    /** Shown when nothing matches. */
    empty?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "Type a command…", empty: "No results." },
)
const emit = defineEmits<{ close: []; select: [value: string] }>()

const idBase = `dk-command-${commandCount++}`
const query = ref("")
const active = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
let previousFocus: HTMLElement | null = null

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.items.filter((i) => i.label.toLowerCase().includes(q)) : props.items
})
/** Group order follows first appearance; ungrouped items fall under "". */
const groups = computed(() => {
  const out = new Map<string, CommandItem[]>()
  for (const item of filtered.value) {
    const g = item.group ?? ""
    if (!out.has(g)) out.set(g, [])
    out.get(g)!.push(item)
  }
  return out
})
const flat = computed(() => [...groups.value.values()].flat())

watch(
  () => props.open,
  (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      query.value = ""
      active.value = 0
      nextTick(() => inputRef.value?.focus())
    } else {
      previousFocus?.focus()
      previousFocus = null
    }
  },
)
watch(query, () => (active.value = 0))

function pick(value: string) {
  emit("select", value)
  emit("close")
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.stopPropagation()
    emit("close")
    return
  }
  // Modal: Tab never leaves the palette — the input is its one field and
  // the list is driven by the arrow keys.
  if (e.key === "Tab") {
    e.preventDefault()
    inputRef.value?.focus()
    return
  }
  const n = flat.value.length
  if (!n) return
  if (e.key === "ArrowDown") (e.preventDefault(), (active.value = (active.value + 1) % n))
  else if (e.key === "ArrowUp") (e.preventDefault(), (active.value = (active.value - 1 + n) % n))
  else if (e.key === "Home") (e.preventDefault(), (active.value = 0))
  else if (e.key === "End") (e.preventDefault(), (active.value = n - 1))
  else if (e.key === "Enter") {
    e.preventDefault()
    const item = flat.value[active.value]
    if (item) pick(item.value)
  }
}
const indexOf = (item: CommandItem) => flat.value.indexOf(item)
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" v-bind="stylex.attrs(styles.grid)" @keydown="onKeydown">
      <div v-bind="stylex.attrs(styles.layer)" aria-hidden="true" @click="emit('close')" />
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="props.placeholder"
        :class="cn(styles.frame, POPOVER, props.xstyle, props.class)"
      >
        <div v-bind="stylex.attrs(styles.row)">
          <span v-bind="stylex.attrs(styles.text)" aria-hidden="true">›</span>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            role="combobox"
            :aria-expanded="true"
            :aria-controls="`${idBase}-list`"
            :aria-activedescendant="flat[active] ? `${idBase}-${indexOf(flat[active])}` : undefined"
            :placeholder="props.placeholder"
            v-bind="stylex.attrs(styles.input)"
          />
          <span v-bind="stylex.attrs(styles.text2)" aria-hidden="true">esc</span>
        </div>
        <ul :id="`${idBase}-list`" role="listbox" v-bind="stylex.attrs(styles.ul)">
          <li v-if="!flat.length" v-bind="stylex.attrs(styles.li)">
            {{ props.empty }}
          </li>
          <template v-for="[group, groupItems] in groups" :key="group || 'top'">
            <li v-if="group" aria-hidden="true" v-bind="stylex.attrs(styles.li2)">
              {{ group }}
            </li>
            <li
              v-for="item in groupItems"
              :id="`${idBase}-${indexOf(item)}`"
              :key="item.value"
              role="option"
              :aria-selected="indexOf(item) === active"
              :class="
                cn(styles.li3, CONTROL_BUTTON, indexOf(item) === active ? styles.bgCard : styles.textMutedForeground)
              "
              @click="pick(item.value)"
              @pointermove="active = indexOf(item)"
            >
              <span v-bind="stylex.attrs(styles.text3)" aria-hidden="true" />
              <span v-bind="stylex.attrs(styles.text4)">{{ item.label }}</span>
              <kbd v-if="item.kbd" v-bind="stylex.attrs(styles.kbd)">{{ item.kbd }}</kbd>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
