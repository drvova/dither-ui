<script lang="ts">
import { BAYER4, fillOf, type PixelColor } from "./pixel"
import { rgb } from "./palette"

/** 2px dithered rail marking the active item — same recipe as the tabs underline. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, cssHeight: number) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const rows = Math.max(4, Math.round(cssHeight / 2))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  for (let y = 0; y < rows; y++) {
    const k = 0.55 + 0.45 * (1 - Math.abs(y / rows - 0.5) * 2)
    if (k > BAYER4[y & 3][0] * 0.9) {
      ctx.fillStyle = rgb(fill, 1, k)
      ctx.fillRect(0, y, 1, 1)
    }
  }
}
</script>

<script setup lang="ts">
import { inject, onMounted, ref, watch } from "vue"
import { SIDEBAR_COLLAPSED } from "./DitherSidebar.vue"

const props = withDefaults(
  defineProps<{
    label: string
    active?: boolean
    color?: PixelColor
  }>(),
  { active: false, color: "blue" }
)
const emit = defineEmits<{ select: [] }>()

const collapsed = inject(SIDEBAR_COLLAPSED, ref(false))
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
    class="relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-left font-mono text-[12px] transition-colors"
    :class="props.active ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'"
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
    <span v-if="!collapsed" class="truncate">{{ props.label }}</span>
  </button>
</template>
