<!-- Generated from ../tailwind/DitherSidebarItem.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { cssColor } from "../engine/palette"
import { cellCanvas } from "../engine/raster"
import * as stylex from "@stylexjs/stylex"

/** 2px dithered rail marking the active item — same recipe as the tabs underline. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, cssHeight: number, matrix: number[][] = BAYER4) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const rows = Math.max(4, Math.round(cssHeight / 2))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  const px = cellCanvas(ctx, 1, rows)
  for (let y = 0; y < rows; y++) {
    const k = 0.55 + 0.45 * (1 - Math.abs(y / rows - 0.5) * 2)
    if (k > matrix[y & 3][0] * 0.9) px.cell(0, y, fill, k)
  }
  px.flush()
}

const styles = stylex.create({
  button: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderRadius: "var(--radius)",
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  h7: { height: "1.75rem", gap: "0.5rem", paddingInline: "0.5rem", fontSize: "11px" },
  h8: { height: "2rem", gap: "0.625rem", paddingInline: "0.625rem", fontSize: "12px" },
  bgCard: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  canvas: { position: "absolute", insetBlock: "0.375rem", left: "0px", width: "2px" },
  grid: { display: "grid", width: "1rem", height: "1rem", flexShrink: "0", placeItems: "center" },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "1px",
    backgroundColor: "currentcolor",
    opacity: "70%",
  },
  text2: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text3: {
    flexShrink: "0",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  layer: {
    position: "absolute",
    top: "0.375rem",
    right: "0.375rem",
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
  },
})
</script>

<script setup lang="ts">
import { inject, onMounted, ref, watch } from "vue"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar.vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    label: string
    active?: boolean
    color?: PixelColor
    /** Right-aligned count — folds to a colored dot on the icon rail. */
    badge?: string | number
  }>(),
  { active: false, color: "blue" },
)
const emit = defineEmits<{ select: [] }>()

const collapsed = inject(SIDEBAR_COLLAPSED, ref(false))
const compact = inject(SIDEBAR_COMPACT, ref(false))
const railRef = ref<HTMLCanvasElement | null>(null)

function paint() {
  const c = railRef.value
  if (c && props.active) paintRail(c, props.color, 24)
}
onMounted(paint)
watch(
  () => [props.active, props.color],
  () => requestAnimationFrame(paint),
)
</script>

<template>
  <button
    type="button"
    :aria-current="props.active ? 'true' : undefined"
    :title="collapsed ? props.label : undefined"
    :class="
      cn(styles.button, [compact ? styles.h7 : styles.h8, props.active ? styles.bgCard : styles.textMutedForeground])
    "
    @click="emit('select')"
  >
    <canvas
      v-if="props.active"
      ref="railRef"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.canvas)"
      style="image-rendering: pixelated"
    />
    <span v-bind="stylex.attrs(styles.grid)" aria-hidden="true">
      <slot name="icon">
        <span v-bind="stylex.attrs(styles.text)" />
      </slot>
    </span>
    <span v-if="!collapsed" v-bind="stylex.attrs(styles.text2)">{{ props.label }}</span>
    <span v-if="props.badge !== undefined && !collapsed" v-bind="stylex.attrs(styles.text3)">{{ props.badge }}</span>
    <span
      v-else-if="props.badge !== undefined && collapsed"
      aria-hidden="true"
      v-bind="stylex.attrs(styles.layer)"
      :style="{ backgroundColor: cssColor(props.color) }"
    />
  </button>
</template>
