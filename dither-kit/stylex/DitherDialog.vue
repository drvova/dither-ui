<!-- Generated from ../tailwind/DitherDialog.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "color-mix(in oklab, #000 65%, transparent)",
    padding: "1.5rem",
  },
  section: {
    width: "100%",
    maxWidth: "28rem",
    overflow: "hidden",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
    backgroundColor: "var(--card)",
    fontFamily: "var(--font-mono)",
    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
  },
  header: {
    display: "flex",
    minHeight: "3rem",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
  },
  box: { minWidth: "0px" },
  h2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
    color: "var(--foreground)",
  },
  p: { marginTop: "0.25rem", fontSize: "12px", lineHeight: "1.625", color: "var(--muted-foreground)" },
  button: {
    display: "flex",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
  box2: { padding: "1rem" },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
  },
})
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    closeOnBackdrop?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { closeOnBackdrop: true },
)
const emit = defineEmits<{ close: [] }>()
const panelRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
// One id per instance, so two open dialogs never share a label.
const idBase = `dk-dialog-${useId()}`
const titleId = `${idBase}-title`
const descriptionId = `${idBase}-description`
let previousFocus: HTMLElement | null = null

const focusable = () => [
  ...(panelRef.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) ?? []),
]
function focusInitial() {
  closeRef.value?.focus() ?? focusable()[0]?.focus()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.stopPropagation()
    emit("close")
    return
  }
  if (e.key !== "Tab") return
  const items = focusable()
  if (!items.length) return e.preventDefault()
  const first = items[0],
    last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
watch(
  () => props.open,
  (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      nextTick(focusInitial)
    } else {
      const restore = previousFocus
      previousFocus = null
      nextTick(() => restore?.focus())
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => previousFocus?.focus())
</script>

<template>
  <Teleport to="body">
    <Transition name="dk-dialog">
      <div
        v-if="props.open"
        v-bind="stylex.attrs(styles.row)"
        @pointerdown.self="props.closeOnBackdrop && emit('close')"
        @keydown="onKeydown"
      >
        <section
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="props.title ? titleId : undefined"
          :aria-label="props.title ? undefined : 'Dialog'"
          :aria-describedby="props.description ? descriptionId : undefined"
          :class="cn(styles.section, props.xstyle, props.class)"
        >
          <header v-bind="stylex.attrs(styles.header)">
            <div v-bind="stylex.attrs(styles.box)">
              <h2 v-if="props.title" :id="titleId" v-bind="stylex.attrs(styles.h2)">{{ props.title }}</h2>
              <p v-if="props.description" :id="descriptionId" v-bind="stylex.attrs(styles.p)">
                {{ props.description }}
              </p>
            </div>
            <button
              ref="closeRef"
              type="button"
              :class="cn(CONTROL_BUTTON, styles.button)"
              aria-label="Close"
              @click="emit('close')"
            >
              ×
            </button>
          </header>
          <div v-bind="stylex.attrs(styles.box2)"><slot /></div>
          <footer v-if="$slots.footer" v-bind="stylex.attrs(styles.footer)">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-dialog-enter-active,
.dk-dialog-leave-active {
  transition: opacity 160ms ease;
}
.dk-dialog-enter-active section,
.dk-dialog-leave-active section {
  transition:
    transform 180ms cubic-bezier(0.2, 0, 0, 1),
    opacity 120ms ease;
}
.dk-dialog-enter-from,
.dk-dialog-leave-to {
  opacity: 0;
}
.dk-dialog-enter-from section,
.dk-dialog-leave-to section {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dk-dialog-enter-active,
  .dk-dialog-leave-active,
  .dk-dialog-enter-active section,
  .dk-dialog-leave-active section {
    transition: none;
  }
}
</style>
