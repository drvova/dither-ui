<script lang="ts">
export type CommandItem = { value: string; label: string; group?: string; kbd?: string }
let commandCount = 0
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { CONTROL_BUTTON, POPOVER } from "./control"
import { cn } from "./lib"

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
  }>(),
  { placeholder: "Type a command…", empty: "No results." }
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
  }
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
    <div v-if="props.open" class="fixed inset-0 z-50 grid place-items-start justify-center pt-[18vh]" @keydown="onKeydown">
      <div class="absolute inset-0 bg-background/70 backdrop-blur-[2px]" aria-hidden="true" @click="emit('close')" />
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="props.placeholder"
        :class="cn('relative w-[min(92vw,480px)] overflow-hidden font-mono', POPOVER, props.class)"
      >
        <div class="flex items-center gap-2 border-b border-border/60 px-3">
          <span class="text-[12px] text-muted-foreground" aria-hidden="true">›</span>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            role="combobox"
            :aria-expanded="true"
            :aria-controls="`${idBase}-list`"
            :aria-activedescendant="flat[active] ? `${idBase}-${indexOf(flat[active])}` : undefined"
            :placeholder="props.placeholder"
            class="h-11 w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <span class="rounded border border-border/60 px-1 text-[9px] text-muted-foreground" aria-hidden="true">esc</span>
        </div>
        <ul :id="`${idBase}-list`" role="listbox" class="max-h-72 overflow-y-auto p-1.5">
          <li v-if="!flat.length" class="px-2.5 py-6 text-center text-[12px] text-muted-foreground">{{ props.empty }}</li>
          <template v-for="[group, groupItems] in groups" :key="group || 'top'">
            <li v-if="group" aria-hidden="true" class="px-2.5 pt-2 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
              {{ group }}
            </li>
            <li
              v-for="item in groupItems"
              :id="`${idBase}-${indexOf(item)}`"
              :key="item.value"
              role="option"
              :aria-selected="indexOf(item) === active"
              :class="
                cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] transition-colors',
                  CONTROL_BUTTON,
                  indexOf(item) === active ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                )
              "
              @click="pick(item.value)"
              @pointermove="active = indexOf(item)"
            >
              <span class="size-1.5 shrink-0 rounded-[1px] bg-current opacity-60" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <kbd v-if="item.kbd" class="rounded border border-border/60 px-1 text-[9px] tabular-nums text-muted-foreground">{{ item.kbd }}</kbd>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
