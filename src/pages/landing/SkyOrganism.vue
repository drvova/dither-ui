<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { ditherTone, SKY, SUN } from "./plates"

// The living sky: a dither-dot organism breathing over the dawn plate's
// horizon. It renders through the SAME rule as every landing figure —
// ditherTone quantizes a luminance field onto the house ramps on the Bayer
// lattice — but the field is alive: three metaballs drift and breathe, the
// pointer drops a fourth that follows the cursor, and cells sitting right at
// their Bayer threshold flicker between lit and unlit at their own rate, so
// the dither's edge shimmers the way the plates' stars twinkle.
//
// Engine budget: one rAF capped at 24fps, run only while the stage is on
// screen AND the tab is visible; DPR clamped to 2; ResizeObserver rebuilds
// the backing store; reduced motion renders one static frame and never
// starts the loop. Decoration: aria-hidden, no semantics, no listeners after
// unmount.
const CELL = 4 // CSS px per dither cell — the lattice the dots sit on
const FPS = 24
const FRAME = 1000 / FPS

type Blob = { ax: number; ay: number; r: number; fx: number; fy: number; px: number; py: number }

// Blobs anchor across the sky's upper-right (never behind the copy, never
// over the plate) with incommensurate drift frequencies, so the combination
// never visibly repeats. Radii key off width against a generous sky budget,
// so the creature reads at desktop width without flooding a narrow stage.
function makeBlobs(w: number, h: number): Blob[] {
  const skyH = h * 0.62
  const dim = Math.min(w, skyH * 2.2) * 0.72
  const anchor = [
    { x: 0.66, y: 0.4, r: 0.26 },
    { x: 0.78, y: 0.56, r: 0.21 },
    { x: 0.88, y: 0.44, r: 0.17 },
  ]
  return anchor.map((a, i) => ({
    ax: a.x * w,
    ay: a.y * skyH + skyH * 0.08,
    r: dim * a.r,
    fx: 0.11 + i * 0.043,
    fy: 0.09 + i * 0.037,
    px: i * 2.399, // golden-angle phases
    py: i * 2.399 + 1.9,
  }))
}

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null
let running = false
let reduced = false
let W = 0 // backing-store pixels
let H = 0
let cols = 0 // dither lattice size
let rows = 0
let cell = CELL // device px per cell (float, DPR-scaled)
let blobs: Blob[] = []
const pointer = { x: -1e4, y: -1e4, w: 0, tx: 0, ty: 0, inside: false }
let last = 0
let acc = 0

// Gaussian blob luminance: a tight bright core with a soft skirt, so the
// creature reads as discrete glowing bodies in the void — an inverse-square
// metaball at these radii floods the whole stage (measured).
function field(x: number, y: number, t: number): number {
  let v = 0
  for (const b of blobs) {
    const bx = b.ax + Math.sin(t * b.fx * Math.PI * 2 + b.px) * b.r * 0.55
    const by = b.ay + Math.cos(t * b.fy * Math.PI * 2 + b.py) * b.r * 0.32
    const r = b.r * (1 + Math.sin(t * 0.23 + b.px) * 0.12) // breathe
    const dx = x - bx
    const dy = y - by
    const s = r * 0.5
    v += 1.1 * Math.exp(-(dx * dx + dy * dy) / (2 * s * s))
  }
  if (pointer.w > 0.01) {
    const dx = x - pointer.x
    const dy = y - pointer.y
    v += pointer.w * 0.9 * Math.exp(-(dx * dx + dy * dy) / (2 * 22 * 22))
  }
  // Cap the density: the core must stay dither-textured (tone stepping
  // through the ramp), never a solid disc.
  return Math.min(v, 1.15)
}

// One row of the organism: quantize each cell's luminance through the house
// dither rule and paint it. The flicker: a cell whose field sits within the
// Bayer rank's own band gets a per-cell flicker factor decided by hash noise
// — edge cells ripple while the body holds steady.
function paint(t: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  const fadeTop = rows * 0.1
  // On narrow stages the copy occupies most of the height: the field dies by
  // mid-stage so the statement keeps its ink. Wide stages let it melt lower.
  const fadeBot = rows * (W < 640 ? 0.4 : 0.68)
  for (let cy = 0; cy < rows; cy++) {
    // Vertical melt: full light in the sky band, gone before the plate seam.
    let melt = 1
    if (cy < fadeTop) melt = cy / fadeTop
    else if (cy > fadeBot) melt = Math.max(0, 1 - (cy - fadeBot) / (rows * 0.14))
    if (melt <= 0.001) continue
    const py = (cy + 0.5) * cell
    for (let cx = 0; cx < cols; cx++) {
      // Field samples in DEVICE pixels (the blobs' space); the loop walks the
      // cell lattice. Mixing the spaces silently starves or floods the field.
      const L = field((cx + 0.5) * cell, py, t) * melt
      if (L < 0.26) continue
      // Threshold-edge sizzle: hash-flicker only the cells near their rank.
      let tone = L
      const h = hash(cx, cy)
      if (h < 0.3) {
        const band = Math.min(3, Math.floor(L * 4))
        tone = L + (h / 0.3 - 1.5) * 0.045 * (1 - Math.abs(L - (band + 0.5) / 4) * 2)
      }
      const ember = L > 0.72
      const color = ember
        ? ditherTone(Math.min(1, (L - 0.72) / 0.24), cx, cy, SUN)
        : ditherTone(Math.min(1, tone / 0.72), cx, cy, SKY)
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(cx * cell, cy * cell, cell - 0.6, cell - 0.6)
    }
  }
}

// Stable per-cell noise (same construction as the plates' star scatter).
function hash(x: number, y: number): number {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function resize() {
  const el = canvas.value
  if (!el) return
  const box = el.parentElement?.getBoundingClientRect()
  if (!box || box.width < 4 || box.height < 4) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = Math.round(box.width * dpr)
  H = Math.round(box.height * dpr)
  el.width = W
  el.height = H
  cell = Math.max(2, (box.width / Math.max(24, Math.round(box.width / CELL))) * dpr)
  cols = Math.ceil(W / cell)
  rows = Math.ceil(H / cell)
  ctx = el.getContext("2d")
  blobs = makeBlobs(W, H)
  paint(reduced ? 0 : acc / 1000)
}

function tick(now: number) {
  raf = 0
  if (!running) return
  if (!last) last = now
  acc += Math.min(now - last, 250) // clamp tab-switch jumps
  last = now
  // Pointer blob eases toward the cursor and fades when it leaves.
  const target = pointer.inside ? 0.55 : 0
  pointer.w += (target - pointer.w) * 0.06
  if (pointer.inside) {
    pointer.x += (pointer.tx - pointer.x) * 0.14
    pointer.y += (pointer.ty - pointer.y) * 0.14
  }
  if (acc >= FRAME) {
    paint(acc / 1000)
    acc %= FRAME
  }
  raf = requestAnimationFrame(tick)
}

function start() {
  if (running || reduced) return
  running = true
  last = 0
  if (!raf) raf = requestAnimationFrame(tick)
}

function stop() {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function onMove(e: PointerEvent) {
  const el = canvas.value
  if (!el) return
  const r = el.getBoundingClientRect()
  pointer.tx = (e.clientX - r.left) * (W / r.width)
  pointer.ty = (e.clientY - r.top) * (H / r.height)
  if (!pointer.inside) {
    pointer.x = pointer.tx
    pointer.y = pointer.ty
  }
  pointer.inside = true
}

function onLeave() {
  pointer.inside = false
}

let roTimer = 0
function onResize() {
  // Coalesce RO bursts; rebuild the lattice at most once per frame.
  if (roTimer) return
  roTimer = requestAnimationFrame(() => {
    roTimer = 0
    resize()
  })
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  resize()
  const stage = el.parentElement
  if (stage) {
    stage.addEventListener("pointermove", onMove, { passive: true })
    stage.addEventListener("pointerleave", onLeave, { passive: true })
  }
  ro = new ResizeObserver(onResize)
  if (stage) ro.observe(stage)
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start()
        else stop()
      },
      { threshold: 0.05 },
    )
    io.observe(el)
  } else {
    start()
  }
  document.addEventListener("visibilitychange", onVisibility)
})

function onVisibility() {
  if (document.hidden) stop()
  else start()
}

onBeforeUnmount(() => {
  stop()
  io?.disconnect()
  ro?.disconnect()
  if (roTimer) cancelAnimationFrame(roTimer)
  document.removeEventListener("visibilitychange", onVisibility)
  const stage = canvas.value?.parentElement
  stage?.removeEventListener("pointermove", onMove)
  stage?.removeEventListener("pointerleave", onLeave)
})
</script>

<template>
  <canvas ref="canvas" aria-hidden="true" class="sky-organism"></canvas>
</template>

<style scoped>
.sky-organism {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
}

@media (prefers-reduced-motion: no-preference) {
  .sky-organism {
    animation: organism-in 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: 200ms;
  }
  @keyframes organism-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
