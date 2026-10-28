<!-- Generated from ../tailwind/DitherContextMenu.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type ContextMenuItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

const styles = stylex.create({
  layer: {
    position: "fixed",
    zIndex: "100",
    minWidth: "180px",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    fontFamily: "var(--font-mono)",
    color: "var(--foreground)",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
    outlineStyle: "none",
  },
  box: { marginBlock: "0.25rem", height: "1px", backgroundColor: "var(--border)" },
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    fontSize: "13px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  button2: {
    color: "oklch(70.4% 0.191 22.216)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, oklch(63.7% 0.237 25.331) 10%, transparent)",
      },
    },
  },
  button3: {
    color: "var(--foreground)",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import { cn } from "./lib"

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
  nextTick(() => {
    // Clamp inside the viewport — menus opened near an edge flip inward.
    const panel = panelRef.value
    if (panel && pos.value) {
      const r = panel.getBoundingClientRect()
      pos.value = {
        x: Math.max(8, Math.min(pos.value.x, window.innerWidth - r.width - 8)),
        y: Math.max(8, Math.min(pos.value.y, window.innerHeight - r.height - 8)),
      }
    }
    panel?.focus()
  })
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
  const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
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
        v-bind="stylex.attrs(styles.layer)"
        :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
        @pointerdown.stop
        @contextmenu.prevent
        @keydown="onKeydown"
      >
        <template v-for="(it, i) in props.items" :key="i">
          <div v-if="it.divider" v-bind="stylex.attrs(styles.box)" />
          <button
            v-else
            :ref="(el) => setItemRef(el, i)"
            type="button"
            role="menuitem"
            :disabled="it.disabled"
            :class="cn(styles.button, it.danger ? styles.button2 : styles.button3)"
            @click="pick(it)"
          >
            {{ it.label }}
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>
