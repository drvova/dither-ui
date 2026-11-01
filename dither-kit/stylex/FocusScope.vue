<!-- Generated from ../tailwind/FocusScope.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { cn, type StyleProp } from "./lib"

/** Focus management for overlays and popovers:
 * `autofocus` moves focus into the scope on mount (first focusable, else the
 * scope itself), `trapped` keeps Tab/Shift+Tab cycling inside it, and
 * `restoreFocus` hands focus back to whatever had it before — the a11y
 * contract every modal in this kit already obeys. */
const props = withDefaults(
  defineProps<{
    autofocus?: boolean
    trapped?: boolean
    restoreFocus?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { autofocus: true, trapped: true, restoreFocus: true },
)

const root = ref<HTMLElement | null>(null)
let previous: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Rendered, so focus can land on it: neither it nor an ancestor inside the
 * scope is `display: none`, and it is not `visibility: hidden`. A control
 * hidden by CSS can never be a Tab endpoint, or Tab from the last visible
 * one would leave the scope. */
function rendered(el: HTMLElement, scope: HTMLElement): boolean {
  if (getComputedStyle(el).visibility === "hidden") return false
  for (let n: HTMLElement | null = el; n && n !== scope; n = n.parentElement)
    if (getComputedStyle(n).display === "none") return false
  return true
}

function focusables(): HTMLElement[] {
  const scope = root.value
  if (!scope) return []
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest("[hidden]") && el.getAttribute("aria-hidden") !== "true" && rendered(el, scope),
  )
}

function onKeyDown(event: KeyboardEvent) {
  if (!props.trapped || event.key !== "Tab" || !root.value) return
  const items = focusables()
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as HTMLElement | null
  const inside = active instanceof HTMLElement && root.value.contains(active)

  if (event.shiftKey) {
    if (!inside || active === first) {
      event.preventDefault()
      last.focus()
    }
  } else if (!inside || active === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (props.autofocus) {
    void nextTick(() => {
      const items = focusables()
      if (items.length > 0) items[0].focus()
      else root.value?.focus()
    })
  }
})

onBeforeUnmount(() => {
  if (props.restoreFocus && previous && previous.isConnected) previous.focus()
})
</script>

<template>
  <div ref="root" tabindex="-1" :class="cn(null, props.xstyle, props.class)" @keydown="onKeyDown">
    <slot />
  </div>
</template>
