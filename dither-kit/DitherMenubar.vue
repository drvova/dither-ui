<script lang="ts">
export type MenubarItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export type MenubarMenu = { label: string; items: MenubarItem[] }
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"

const props = defineProps<{ menus: MenubarMenu[] }>()
const emit = defineEmits<{ select: [menu: string, item: string] }>()

const openIndex = ref<number | null>(null)
const rootRef = ref<HTMLDivElement | null>(null)
const topRefs = ref<HTMLButtonElement[]>([])
const itemRefs = ref<HTMLButtonElement[]>([])

function setTopRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) topRefs.value[i] = el
}
function setItemRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) itemRefs.value[i] = el
}

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}

function hover(i: number) {
  // desktop menubar behavior: hovering another top item switches the open menu
  if (openIndex.value !== null && openIndex.value !== i) openIndex.value = i
}

function pick(menu: MenubarMenu, it: MenubarItem, i: number) {
  if (it.disabled || it.divider) return
  emit("select", menu.label, it.label ?? "")
  openIndex.value = null
  topRefs.value[i]?.focus()
}

function moveTop(dir: number) {
  const n = props.menus.length
  if (!n) return
  const cur =
    openIndex.value ??
    topRefs.value.indexOf(document.activeElement as HTMLButtonElement)
  const next = cur === -1 ? (dir > 0 ? 0 : n - 1) : (cur + dir + n) % n
  topRefs.value[next]?.focus()
  if (openIndex.value !== null) openIndex.value = next
}

function moveFocus(dir: number) {
  const els = itemRefs.value.filter((el): el is HTMLButtonElement => !!el)
  if (!els.length) return
  const i = els.indexOf(document.activeElement as HTMLButtonElement)
  const next =
    i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
  els[next]?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowRight") {
    e.preventDefault()
    moveTop(1)
  } else if (e.key === "ArrowLeft") {
    e.preventDefault()
    moveTop(-1)
  } else if (e.key === "Escape" && openIndex.value !== null) {
    e.stopPropagation()
    const i = openIndex.value
    openIndex.value = null
    topRefs.value[i]?.focus()
  } else if (e.key === "ArrowDown" && openIndex.value !== null) {
    e.preventDefault()
    moveFocus(1)
  } else if (e.key === "ArrowUp" && openIndex.value !== null) {
    e.preventDefault()
    moveFocus(-1)
  }
}

function onOutside(e: PointerEvent) {
  if (rootRef.value?.contains(e.target as Node)) return
  openIndex.value = null
}

let timer = 0
watch(openIndex, (v, old) => {
  if (v !== null) itemRefs.value = []
  if (v !== null && old === null) {
    // defer so the opening click doesn't immediately close it
    timer = window.setTimeout(
      () => window.addEventListener("pointerdown", onOutside),
      0
    )
  } else if (v === null) {
    clearTimeout(timer)
    window.removeEventListener("pointerdown", onOutside)
  }
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener("pointerdown", onOutside)
})
</script>

<template>
  <div
    ref="rootRef"
    role="menubar"
    class="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
    @keydown="onKeydown"
  >
    <div
      v-for="(menu, mi) in props.menus"
      :key="menu.label"
      class="relative inline-block"
    >
      <button
        :ref="(el) => setTopRef(el, mi)"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="openIndex === mi"
        class="rounded-md px-2.5 py-1 font-mono text-xs transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
        :class="
          openIndex === mi
            ? 'bg-background text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="toggle(mi)"
        @pointerenter="hover(mi)"
      >
        {{ menu.label }}
      </button>
      <Transition name="dk-pop">
        <div
          v-if="openIndex === mi"
          role="menu"
          class="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <template v-for="(it, i) in menu.items" :key="i">
            <div v-if="it.divider" class="my-1 h-px bg-border" />
            <button
              v-else
              :ref="(el) => setItemRef(el, i)"
              type="button"
              role="menuitem"
              :disabled="it.disabled"
              class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40"
              :class="
                it.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-foreground hover:bg-background'
              "
              @click="pick(menu, it, mi)"
            >
              {{ it.label }}
            </button>
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.dk-pop-enter-active,
.dk-pop-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}
.dk-pop-enter-from,
.dk-pop-leave-to {
  opacity: 0;
  transform: translateY(2px);
}
@media (prefers-reduced-motion: reduce) {
  .dk-pop-enter-active,
  .dk-pop-leave-active {
    transition: none;
  }
}
</style>
