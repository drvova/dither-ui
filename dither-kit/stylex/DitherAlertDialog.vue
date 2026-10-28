<!-- Generated from ../tailwind/DitherAlertDialog.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
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
  box: {
    width: "100%",
    maxWidth: "28rem",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
    backgroundColor: "var(--card)",
    fontFamily: "var(--font-mono)",
    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
  },
  box2: { paddingInline: "1rem", paddingTop: "1rem" },
  text: { fontSize: "0.875rem", lineHeight: "calc(1.25 / 0.875)", fontWeight: "500" },
  p: { marginTop: "0.5rem", fontSize: "13px", lineHeight: "1.625", color: "var(--muted-foreground)" },
  row2: { display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "1rem" },
  button: {
    minHeight: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import DitherButton from "./DitherButton.vue"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: "Confirm", cancelLabel: "Cancel", danger: false },
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const panelRef = ref<HTMLElement | null>(null)
const cancelRef = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null
const focusable = () => [
  ...(panelRef.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) ?? []),
]
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.stopPropagation()
    emit("cancel")
    return
  }
  if (e.key !== "Tab") return
  const items = focusable(),
    first = items[0],
    last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last?.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first?.focus()
  }
}
watch(
  () => props.open,
  (open) => {
    if (open) {
      previousFocus = document.activeElement as HTMLElement | null
      nextTick(() => cancelRef.value?.focus())
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
    <Transition name="dk-fade">
      <div
        v-if="props.open"
        role="alertdialog"
        aria-modal="true"
        :aria-label="props.title"
        v-bind="stylex.attrs(styles.row)"
        @pointerdown.self="emit('cancel')"
        @keydown="onKeydown"
      >
        <div ref="panelRef" v-bind="stylex.attrs(styles.box)">
          <div v-bind="stylex.attrs(styles.box2)">
            <span v-bind="stylex.attrs(styles.text)">{{ props.title }}</span>
            <p v-if="props.description" v-bind="stylex.attrs(styles.p)">
              {{ props.description }}
            </p>
          </div>
          <div v-bind="stylex.attrs(styles.row2)">
            <button ref="cancelRef" type="button" :class="cn(CONTROL_BUTTON, styles.button)" @click="emit('cancel')">
              {{ props.cancelLabel }}
            </button>
            <DitherButton :color="props.danger ? 'red' : 'blue'" @click="emit('confirm')">
              {{ props.confirmLabel }}
            </DitherButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-fade-enter-active,
.dk-fade-leave-active {
  transition: opacity 160ms ease;
}
.dk-fade-enter-from,
.dk-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dk-fade-enter-active,
  .dk-fade-leave-active {
    transition: none;
  }
}
</style>
