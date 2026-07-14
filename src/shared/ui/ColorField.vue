<script setup lang="ts">
import { computed } from "vue"
import { COLORS } from "@/shared/config"
import { cssColor, type DitherColor } from "@dither-kit"

const props = defineProps<{ modelValue: DitherColor | number }>()
const emit = defineEmits<{ "update:modelValue": [DitherColor | number] }>()

const isHue = computed(() => typeof props.modelValue === "number")
const hue = computed<number>({
  get: () => (typeof props.modelValue === "number" ? props.modelValue : 210),
  set: (v) => emit("update:modelValue", v),
})
function enableHue() {
  emit("update:modelValue", typeof props.modelValue === "number" ? props.modelValue : 210)
}
</script>

<template>
  <div class="flex flex-col gap-2">
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
        :class="isHue ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : 'ring-1 ring-border'"
        :style="isHue ? { backgroundColor: cssColor(hue) } : { background: 'conic-gradient(from 0deg, red, #ff0, lime, cyan, blue, magenta, red)' }"
        title="Custom hue"
        aria-label="Custom hue"
        @click="enableHue"
      />
    </div>
    <div v-if="isHue" class="flex items-center gap-2">
      <input
        v-model.number="hue"
        type="range"
        name="hue"
        min="0"
        max="359"
        class="dk-hue h-2 flex-1 cursor-pointer appearance-none rounded-full"
      />
      <span class="w-9 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">{{ hue }}°</span>
    </div>
  </div>
</template>

<style scoped>
.dk-hue {
  background: linear-gradient(
    to right,
    hsl(0 85% 58%), hsl(60 85% 58%), hsl(120 85% 58%),
    hsl(180 85% 58%), hsl(240 85% 58%), hsl(300 85% 58%), hsl(360 85% 58%)
  );
}
.dk-hue::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.35);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.dk-hue::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.35);
}
</style>
