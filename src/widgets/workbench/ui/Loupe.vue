<script setup lang="ts">
// The pixel loupe (beyond Kobra): the pixels under the pointer magnified on
// their grid — the dither as the screen draws it — with the centre pixel's
// colour and position. Live: animated canvases are read as they are now.
// The wheel zooms; a click samples the centre pixel.
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useBench } from "../context"
import { formatColor, type RGBA } from "../model/color"

const b = useBench()
const SIZE = 132
const view = ref<HTMLCanvasElement | null>(null)
const center = ref<RGBA | null>(null)
const tiny = document.createElement("canvas")

const place = computed(() => {
  const p = b.pointer.value
  if (!p) return null
  const flipX = p.x + 20 + SIZE > b.size.value.w
  const flipY = p.y + 20 + SIZE + 24 > b.size.value.h
  return {
    left: `${flipX ? p.x - 20 - SIZE : p.x + 20}px`,
    top: `${flipY ? Math.max(0, p.y - 20 - SIZE - 24) : p.y + 20}px`,
  }
})

let raf = 0
let last = 0
function draw(now: number) {
  raf = requestAnimationFrame(draw)
  const p = b.pointer.value
  const c = view.value
  if (!p || !c || now - last < 50) return
  last = now
  const z = b.loupeZoom.value
  const cols = Math.ceil(SIZE / z) | 1
  tiny.width = cols
  tiny.height = cols
  const t = tiny.getContext("2d", { willReadFrequently: true })
  if (!t) return
  b.paintPixels(t, p, cols, cols)
  const mid = Math.floor(cols / 2)
  const [r, g, bl, a] = t.getImageData(mid, mid, 1, 1).data
  center.value = { r, g, b: bl, a: Math.round((a / 255) * 1000) / 1000 }
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = SIZE * dpr
  c.height = SIZE * dpr
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingEnabled = false
  const off = (SIZE - cols * z) / 2
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.drawImage(tiny, off, off, cols * z, cols * z)
  if (z >= 6) {
    ctx.strokeStyle = "rgb(127 127 127 / 0.28)"
    ctx.lineWidth = 1 / dpr
    ctx.beginPath()
    for (let i = 0; i <= cols; i++) {
      ctx.moveTo(off + i * z, 0)
      ctx.lineTo(off + i * z, SIZE)
      ctx.moveTo(0, off + i * z)
      ctx.lineTo(SIZE, off + i * z)
    }
    ctx.stroke()
  }
  ctx.lineWidth = 1.5
  ctx.strokeStyle = "rgb(0 0 0 / 0.9)"
  ctx.strokeRect(off + mid * z - 0.75, off + mid * z - 0.75, z + 1.5, z + 1.5)
  ctx.strokeStyle = "rgb(255 255 255 / 0.95)"
  ctx.lineWidth = 1
  ctx.strokeRect(off + mid * z + 0.5, off + mid * z + 0.5, z - 1, z - 1)
}

onMounted(() => (raf = requestAnimationFrame(draw)))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div v-if="place" class="wb-loupe" :style="place" aria-hidden="true">
    <canvas ref="view" class="lens" :style="{ width: `${SIZE}px`, height: `${SIZE}px` }" />
    <span class="read">
      <i class="sw" :style="{ background: center ? formatColor(center, 'hex') : 'transparent' }" />
      {{ center ? formatColor(center, b.settings.format) : "none" }}
      <em>{{ b.pointer.value?.x }},{{ b.pointer.value?.y }} at {{ b.loupeZoom.value }}×</em>
    </span>
  </div>
</template>

<style scoped>
.wb-loupe {
  position: absolute;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}

.lens {
  display: block;
  border-radius: 10px;
  background: var(--color-background);
  box-shadow:
    0 0 0 1px var(--color-border),
    0 6px 18px rgb(0 0 0 / 0.4);
}

.read {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 10px;
  white-space: nowrap;
  color: var(--color-foreground);
  background: var(--color-background);
  box-shadow: 0 0 0 1px var(--color-border);
}

.read em {
  font-style: normal;
  color: var(--color-muted-foreground);
}

.sw {
  width: 9px;
  height: 9px;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 30%, transparent);
}
</style>
