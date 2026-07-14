<script lang="ts">
export type ContextMenuItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"

const props = defineProps<{ items: ContextMenuItem[] }>()
const emit = defineEmits<{ select: [label: string] }>()

const pos = ref<{ x: number; y: number } | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const itemRefs = ref<HTMLButtonElement[]>([])

function setItemRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) itemRefs.value[i] = el
}

function onContextmenu(e: MouseEvent) {
  itemRefs.value = []
  pos.value = { x: e.clientX, y: e.clientY }
  nextTick(() => panelRef.value?.focus())
}

function pick(it: ContextMenuItem) {
  if (it.disabled || it.divider) return
  emit("select", it.label ?? "")
  pos.value = null
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
  if (e.key === "Escape") {
    e.stopPropagation()
    pos.value = null
  } else if (e.key === "ArrowDown") {
    e.preventDefault()
    moveFocus(1)
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    moveFocus(-1)
  }
}

const closePanel = () => {
  pos.value = null
}

let timer = 0
watch(pos, (v, old) => {
  if (v && !old) {
    // defer so the opening press doesn't immediately close it
    timer = window.setTimeout(() => {
      window.addEventListener("pointerdown", closePanel)
      window.addEventListener("blur", closePanel)
    }, 0)
  } else if (!v) {
    clearTimeout(timer)
    window.removeEventListener("pointerdown", closePanel)
    window.removeEventListener("blur", closePanel)
  }
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener("pointerdown", closePanel)
  window.removeEventListener("blur", closePanel)
})
</script>

<template>
  <div @contextmenu.prevent="onContextmenu">
    <slot />
    <Teleport to="body">
      <div
        v-if="pos"
        ref="panelRef"
        role="menu"
        tabindex="-1"
        class="fixed z-[100] min-w-[180px] rounded-lg border border-border bg-card p-1 text-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] outline-none"
        :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
        @pointerdown.stop
        @contextmenu.prevent
        @keydown="onKeydown"
      >
        <template v-for="(it, i) in props.items" :key="i">
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
            @click="pick(it)"
          >
            {{ it.label }}
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>
