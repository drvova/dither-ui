<!-- Generated from ../tailwind/DitherMenubar.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type MenubarItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export type MenubarMenu = { label: string; items: MenubarItem[] }

const styles = stylex.create({
  row: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.125rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.125rem",
  },
  frame: { position: "relative", display: "inline-block" },
  button: {
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.25rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  button2: { backgroundColor: "var(--background)", color: "var(--foreground)" },
  button3: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
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
  button4: {
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
  button5: {
    color: "oklch(70.4% 0.191 22.216)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, oklch(63.7% 0.237 25.331) 10%, transparent)",
      },
    },
  },
  button6: {
    color: "var(--foreground)",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue"
import { cn } from "./lib"

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
  const cur = openIndex.value ?? topRefs.value.indexOf(document.activeElement as HTMLButtonElement)
  const next = cur === -1 ? (dir > 0 ? 0 : n - 1) : (cur + dir + n) % n
  topRefs.value[next]?.focus()
  if (openIndex.value !== null) openIndex.value = next
}

function moveFocus(dir: number) {
  const els = itemRefs.value.filter((el): el is HTMLButtonElement => !!el)
  if (!els.length) return
  const i = els.indexOf(document.activeElement as HTMLButtonElement)
  const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
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
    timer = window.setTimeout(() => window.addEventListener("pointerdown", onOutside), 0)
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
  <div ref="rootRef" role="menubar" v-bind="stylex.attrs(styles.row)" @keydown="onKeydown">
    <div v-for="(menu, mi) in props.menus" :key="menu.label" v-bind="stylex.attrs(styles.frame)">
      <button
        :ref="(el) => setTopRef(el, mi)"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="openIndex === mi"
        :class="cn(styles.button, openIndex === mi ? styles.button2 : styles.button3)"
        @click="toggle(mi)"
        @pointerenter="hover(mi)"
      >
        {{ menu.label }}
      </button>
      <Transition name="dk-pop">
        <div v-if="openIndex === mi" role="menu" v-bind="stylex.attrs(styles.layer)">
          <template v-for="(it, i) in menu.items" :key="i">
            <div v-if="it.divider" v-bind="stylex.attrs(styles.box)" />
            <button
              v-else
              :ref="(el) => setItemRef(el, i)"
              type="button"
              role="menuitem"
              :disabled="it.disabled"
              :class="cn(styles.button4, it.danger ? styles.button5 : styles.button6)"
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
