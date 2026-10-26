<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "./lib"

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
  }>(),
  { autofocus: true, trapped: true, restoreFocus: true },
)

const root = ref<HTMLElement | null>(null)
let previous: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  if (!root.value) return []
  return [...root.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest("[hidden]") && el.getAttribute("aria-hidden") !== "true",
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
  <div ref="root" tabindex="-1" :class="cn('', props.class)" @keydown="onKeyDown">
    <slot />
  </div>
</template>
