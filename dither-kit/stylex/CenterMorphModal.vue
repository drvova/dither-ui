<!-- Generated from ../tailwind/CenterMorphModal.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    backgroundColor: "color-mix(in oklab, #000 65%, transparent)",
    padding: { default: "1rem", "@media (width >= 40rem)": "1.5rem" },
  },
  section: {
    position: "relative",
    display: "flex",
    height: "100%",
    width: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
    backgroundColor: "var(--card)",
    fontFamily: "var(--font-mono)",
    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
  },
  button: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    zIndex: "10",
    display: "flex",
    width: "2rem",
    height: "2rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 85%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  box: { minHeight: "0px", flex: "1", overflow: "auto", padding: "1.5rem" },
})
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    open: boolean
    label?: string
    closeOnBackdrop?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { label: "Modal", closeOnBackdrop: true },
)
const emit = defineEmits<{ close: [] }>()
const panelRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
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
    <Transition name="dk-cmm">
      <div
        v-if="props.open"
        v-bind="stylex.attrs(styles.layer)"
        @pointerdown.self="props.closeOnBackdrop && emit('close')"
        @keydown="onKeydown"
      >
        <section
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="props.label"
          :class="cn([styles.section, 'dk-cmm-panel'], props.xstyle, props.class)"
        >
          <button
            ref="closeRef"
            type="button"
            :class="cn(CONTROL_BUTTON, styles.button)"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
          <div v-bind="stylex.attrs(styles.box)"><slot /></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dk-cmm-enter-active {
  transition: opacity 480ms cubic-bezier(0.76, 0, 0.24, 1);
}
.dk-cmm-leave-active {
  transition: opacity 220ms ease 200ms;
}
.dk-cmm-enter-from,
.dk-cmm-leave-to {
  opacity: 0;
}
.dk-cmm-enter-active .dk-cmm-panel {
  animation: dk-cmm-unfold 480ms cubic-bezier(0.76, 0, 0.24, 1) both;
}
.dk-cmm-leave-active .dk-cmm-panel {
  animation: dk-cmm-unfold 400ms cubic-bezier(0.76, 0, 0.24, 1) reverse both;
}
@keyframes dk-cmm-unfold {
  0% {
    clip-path: inset(50% round 0.75rem);
  }
  46% {
    clip-path: inset(calc(50% - 1px) 0 round 0.75rem);
  }
  100% {
    clip-path: inset(0 round 0.75rem);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dk-cmm-enter-active,
  .dk-cmm-leave-active {
    transition: none;
  }
  .dk-cmm-enter-active .dk-cmm-panel,
  .dk-cmm-leave-active .dk-cmm-panel {
    animation: none;
  }
}
</style>
