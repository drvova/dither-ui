<!-- Generated from ../tailwind/DitherMenu.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type MenuItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  button: {
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: {
      default: "var(--card)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: {
      default: null,
      ":focus-visible": "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 40%, transparent)",
    },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  layer: {
    position: "absolute",
    top: "100%",
    left: "0px",
    zIndex: "30",
    marginTop: "0.375rem",
    minWidth: "180px",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  box: { marginBlock: "0.25rem", height: "1px", backgroundColor: "var(--border)" },
  button2: {
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
  button3: {
    color: "oklch(70.4% 0.191 22.216)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, oklch(63.7% 0.237 25.331) 10%, transparent)",
      },
    },
  },
  button4: {
    color: "var(--foreground)",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"
import { cn } from "./lib"

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
  const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
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
    timer = window.setTimeout(() => window.addEventListener("pointerdown", onOutside), 0)
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
  <div ref="rootRef" v-bind="stylex.attrs(styles.frame)" @keydown="onKeydown">
    <button
      ref="triggerRef"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      v-bind="stylex.attrs(styles.button)"
      @click="open = !open"
    >
      <slot />
    </button>
    <Transition name="dk-pop">
      <div v-if="open" role="menu" v-bind="stylex.attrs(styles.layer)">
        <template v-for="(it, i) in props.items" :key="i">
          <div v-if="it.divider" v-bind="stylex.attrs(styles.box)" />
          <button
            v-else
            :ref="(el) => setItemRef(el, i)"
            type="button"
            role="menuitem"
            :disabled="it.disabled"
            :class="cn(styles.button2, it.danger ? styles.button3 : styles.button4)"
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
