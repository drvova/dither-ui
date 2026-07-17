<script lang="ts">
import { BAYER4, fillOf, type PixelColor } from "./pixel"
import { cssColor, rgb } from "./palette"

/** 2px dithered rail marking the active item — same recipe as the tabs underline. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, cssHeight: number, matrix: number[][] = BAYER4) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const rows = Math.max(4, Math.round(cssHeight / 2))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  for (let y = 0; y < rows; y++) {
    const k = 0.55 + 0.45 * (1 - Math.abs(y / rows - 0.5) * 2)
    if (k > matrix[y & 3][0] * 0.9) {
      ctx.fillStyle = rgb(fill, 1, k)
      ctx.fillRect(0, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { inject, onMounted, ref, watch } from "vue"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar.vue"

const props = withDefaults(
  defineProps<{
    label: string
    active?: boolean
    color?: PixelColor
    /** Right-aligned count — folds to a colored dot on the icon rail. */
    badge?: string | number
  }>(),
  { active: false, color: "blue" }
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
watch(() => [props.active, props.color], () => requestAnimationFrame(paint))
</script>

<template>
  <button
    type="button"
    :aria-current="props.active ? 'true' : undefined"
    :title="collapsed ? props.label : undefined"
    class="relative flex items-center rounded-md text-left font-mono transition-colors"
    :class="[
      compact ? 'h-7 gap-2 px-2 text-[11px]' : 'h-8 gap-2.5 px-2.5 text-[12px]',
      props.active ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
    ]"
    @click="emit('select')"
  >
    <canvas
      v-if="props.active"
      ref="railRef"
      aria-hidden="true"
      class="absolute inset-y-1.5 left-0 w-[2px]"
      style="image-rendering: pixelated"
    />
    <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
      <slot name="icon">
        <span class="size-1.5 rounded-[1px] bg-current opacity-70" />
      </slot>
    </span>
    <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ props.label }}</span>
    <span
      v-if="props.badge !== undefined && !collapsed"
      class="shrink-0 rounded border border-border/60 px-1 text-[10px] text-muted-foreground tabular-nums"
    >{{ props.badge }}</span>
    <span
      v-else-if="props.badge !== undefined && collapsed"
      aria-hidden="true"
      class="absolute top-1.5 right-1.5 size-1.5 rounded-full"
      :style="{ backgroundColor: cssColor(props.color) }"
    />
  </button>
</template>
