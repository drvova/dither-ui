<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { COLORS } from "@/shared/config"
import { colorToHex, cssColor, type DitherColor, hexToHsv, hsvToHex } from "@dither-kit"

const props = defineProps<{ modelValue: DitherColor | string }>()
const emit = defineEmits<{ "update:modelValue": [DitherColor | string] }>()

const presets = COLORS as readonly string[]
const isPreset = computed(() => presets.includes(props.modelValue as string))

const hsv = reactive({ h: 210, s: 0.7, v: 0.9 })
const hex = computed(() => hsvToHex(hsv.h, hsv.s, hsv.v))

function syncFromModel() {
  const c = hexToHsv(colorToHex(props.modelValue))
  hsv.h = c.h
  hsv.s = c.s
  hsv.v = c.v
}
syncFromModel()
watch(
  () => props.modelValue,
  (v) => {
    // Skip re-sync when the change is our own emit (avoids thumb jitter).
    if (presets.includes(v as string) || v !== hex.value) syncFromModel()
  },
)

const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const push = () => emit("update:modelValue", hex.value)

const square = ref<HTMLElement | null>(null)
function onSquare(e: PointerEvent) {
  const move = (ev: PointerEvent) => {
    const r = square.value?.getBoundingClientRect()
    if (!r) return
    hsv.s = clamp((ev.clientX - r.left) / r.width)
    hsv.v = 1 - clamp((ev.clientY - r.top) / r.height)
    push()
  }
  move(e)
  const up = () => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
}

function onHex(e: Event) {
  let v = (e.target as HTMLInputElement).value.trim().replace(/^#/, "")
  if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.replace(/(.)/g, "$1$1")
  if (/^[0-9a-fA-F]{6}$/.test(v)) emit("update:modelValue", `#${v.toLowerCase()}`)
}
function enableCustom() {
  emit("update:modelValue", colorToHex(props.modelValue))
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="c in COLORS"
        :key="c"
        type="button"
        class="size-5 rounded-[4px] transition-transform hover:scale-110"
        :class="modelValue === c ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : 'ring-1 ring-border'"
        :style="{ backgroundColor: cssColor(c) }"
        :title="c"
        :aria-label="c"
        @click="emit('update:modelValue', c)"
      />
      <button
        type="button"
        class="size-5 rounded-[4px] transition-transform hover:scale-110"
        :class="!isPreset ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : 'ring-1 ring-border'"
        :style="
          !isPreset
            ? { backgroundColor: hex }
            : { background: 'conic-gradient(from 0deg, red, #ff0, lime, cyan, blue, magenta, red)' }
        "
        title="Custom colour"
        aria-label="Custom colour"
        @click="enableCustom"
      />
    </div>

    <div v-if="!isPreset" class="flex flex-col gap-2">
      <!-- saturation / value square -->
      <div
        ref="square"
        class="relative h-28 w-full cursor-crosshair overflow-hidden rounded-md ring-1 ring-border"
        :style="{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }"
        @pointerdown="onSquare"
      >
        <div class="absolute inset-0" style="background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0))" />
        <div class="absolute inset-0" style="background: linear-gradient(to top, #000, rgba(0, 0, 0, 0))" />
        <div
          class="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }"
        />
      </div>

      <!-- hue -->
      <input
        v-model.number="hsv.h"
        type="range"
        name="hue"
        min="0"
        max="360"
        class="dk-hue h-2.5 w-full cursor-pointer appearance-none rounded-full"
        @input="push"
      />

      <!-- hex -->
      <div class="flex items-center gap-2">
        <span class="size-5 shrink-0 rounded-[4px] ring-1 ring-border" :style="{ backgroundColor: hex }" />
        <input
          type="text"
          name="hex"
          spellcheck="false"
          autocomplete="off"
          :value="hex"
          class="w-full rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-xs uppercase text-foreground outline-none focus:border-foreground/40"
          @change="onHex"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dk-hue {
  background: linear-gradient(
    to right,
    hsl(0 100% 50%),
    hsl(60 100% 50%),
    hsl(120 100% 50%),
    hsl(180 100% 50%),
    hsl(240 100% 50%),
    hsl(300 100% 50%),
    hsl(360 100% 50%)
  );
}
.dk-hue::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.35);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.dk-hue::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.35);
}
</style>
