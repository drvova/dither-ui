<script setup lang="ts">
// Responsive: the same preview rendered again in frames of fixed container
// widths, side by side. Kit components size from their container (and
// container units), so each frame shows the layout at that width; the
// frames share the preview's state and are inert copies (one live preview
// keeps the focus order and ids). Fit scales the row into view; 1:1 scrolls.
import { computed, onBeforeUnmount, onMounted, ref, type Slot } from "vue"
import { useBench } from "../context"
import { ICONS } from "../model/tools"
import Icon from "./Icon.vue"

const props = defineProps<{ render?: Slot }>()
const b = useBench()
const PRESETS = [320, 375, 768, 1024, 1280]
const widths = ref([320, 768, 1280])
const fit = ref(true)
const custom = ref(480)
const row = ref<HTMLElement | null>(null)
const room = ref(0)
const heights = ref<Record<number, number>>({})

/** The slot rendered as a component: one fresh tree per frame. */
const Copy = () => props.render?.()

let ro: ResizeObserver | null = null
onMounted(() => {
  if (typeof ResizeObserver === "undefined" || !row.value) return
  ro = new ResizeObserver(() => {
    room.value = row.value?.clientWidth ?? 0
    const next: Record<number, number> = {}
    row.value
      ?.querySelectorAll<HTMLElement>("[data-frame]")
      .forEach((el) => (next[+el.dataset.frame!] = el.offsetHeight))
    heights.value = next
  })
  ro.observe(row.value)
  row.value.querySelectorAll("[data-frame]").forEach((el) => ro!.observe(el))
})
onBeforeUnmount(() => ro?.disconnect())

const GAP = 16
const scale = computed(() => {
  if (!fit.value || !room.value) return 1
  const total = widths.value.reduce((s, w) => s + w, 0) + GAP * (widths.value.length - 1)
  return Math.min(1, room.value / total)
})

function toggle(w: number) {
  widths.value = widths.value.includes(w)
    ? widths.value.filter((x) => x !== w)
    : [...widths.value, w].sort((x, y) => x - y)
  setTimeout(() => row.value?.querySelectorAll("[data-frame]").forEach((el) => ro?.observe(el)))
}

function add() {
  const w = Math.min(2560, Math.max(160, Math.round(custom.value)))
  if (!widths.value.includes(w)) toggle(w)
  b.say(`${w} px frame`)
}
</script>

<template>
  <section class="wb-responsive" aria-label="Responsive frames">
    <header class="row">
      <span class="micro">Responsive</span>
      <span class="dim">the preview at container widths</span>
      <span class="spacer" />
      <div class="seg" role="group" aria-label="Frame widths">
        <button v-for="w in PRESETS" :key="w" type="button" :aria-pressed="widths.includes(w)" @click="toggle(w)">
          {{ w }}
        </button>
      </div>
      <form class="row" @submit.prevent="add">
        <label class="num"
          ><input v-model.number="custom" type="number" min="160" max="2560" aria-label="Custom width in px" />
          px</label
        >
        <button type="submit" class="act">Add</button>
      </form>
      <div class="seg" role="group" aria-label="Scale">
        <button type="button" :aria-pressed="fit" @click="fit = true">fit</button>
        <button type="button" :aria-pressed="!fit" @click="fit = false">1:1</button>
      </div>
      <button type="button" class="act" aria-label="Close responsive frames" @click="b.toggle('responsive')">
        <Icon :d="ICONS.close" :size="12" />
      </button>
    </header>
    <div ref="row" class="frames" :class="{ scroll: !fit }">
      <figure
        v-for="w in widths"
        :key="w"
        class="frame"
        :style="{ width: `${w * scale}px`, height: heights[w] ? `${heights[w] * scale + 18}px` : undefined }"
      >
        <figcaption class="micro">{{ w }} px</figcaption>
        <div
          class="inner"
          :data-frame="w"
          :style="{ width: `${w}px`, transform: `scale(${scale})` }"
          inert
          aria-hidden="true"
        >
          <Copy />
        </div>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.wb-responsive {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  border-radius: 8px;
  font-size: 11px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.spacer {
  flex: 1;
}

.dim {
  color: var(--color-muted-foreground);
}

.frames {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  overflow: hidden;
}

.frames.scroll {
  overflow-x: auto;
}

.frame {
  flex: none;
  margin: 0;
  overflow: hidden;
}

.frame figcaption {
  height: 18px;
  color: var(--color-muted-foreground);
}

.inner {
  padding: 16px;
  border: 1px dashed color-mix(in oklab, var(--color-border) 80%, transparent);
  border-radius: 6px;
  transform-origin: top left;
  container-type: inline-size;
}

.act,
.seg > button {
  display: inline-flex;
  align-items: center;
  min-width: 24px;
  min-height: 24px;
  padding: 0 7px;
  border-radius: 5px;
  color: var(--color-muted-foreground);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.act:hover,
.seg > button:hover {
  color: var(--color-foreground);
}

.seg {
  display: flex;
  gap: 3px;
}

.seg > button {
  box-shadow: none;
}

.seg > button[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}

.num {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-muted-foreground);
}

.num input {
  width: 64px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  font: inherit;
  color: var(--color-foreground);
  background: var(--color-card);
}
</style>
