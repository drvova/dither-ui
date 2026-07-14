<script lang="ts">
export type MenuItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"

const props = defineProps<{ items: MenuItem[] }>()
const emit = defineEmits<{ select: [label: string] }>()

const open = ref(false)
const rootRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const itemRefs = ref<HTMLButtonElement[]>([])

function setItemRef(el: unknown, i: number) {
  if (el instanceof HTMLButtonElement) itemRefs.value[i] = el
}

function closeMenu(refocus = false) {
  open.value = false
  if (refocus) triggerRef.value?.focus()
}

function pick(it: MenuItem) {
  if (it.disabled || it.divider) return
  emit("select", it.label ?? "")
  closeMenu(true)
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
  if (!open.value) return
  if (e.key === "Escape") {
    e.stopPropagation()
    closeMenu(true)
  } else if (e.key === "ArrowDown") {
    e.preventDefault()
    moveFocus(1)
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    moveFocus(-1)
  }
}

function onOutside(e: PointerEvent) {
  if (rootRef.value?.contains(e.target as Node)) return
  open.value = false
}

let timer = 0
watch(open, (v) => {
  if (v) {
    itemRefs.value = []
    // defer so the opening click doesn't immediately close it
    timer = window.setTimeout(
      () => window.addEventListener("pointerdown", onOutside),
      0
    )
  } else {
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
  <div ref="rootRef" class="relative inline-block" @keydown="onKeydown">
    <button
      ref="triggerRef"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      class="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:bg-background focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
      @click="open = !open"
    >
      <slot />
    </button>
    <Transition name="dk-pop">
      <div
        v-if="open"
        role="menu"
        class="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
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
    </Transition>
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
