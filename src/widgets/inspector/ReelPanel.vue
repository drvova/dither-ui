<script setup lang="ts">
// The reel's cut: its clips in order, each with its length and the
// transition it comes in by; reorder or drop them here, add frames from the
// picker. The film over it: per clip a camera move, a chapter (a line and
// figure-first spec rows) and spec callouts; for the reel, a score made
// from the cut, previewed here with the reel replayed from its start. The
// timeline itself is features/reel; this panel only edits the model.
import { computed, onBeforeUnmount, ref } from "vue"
import { editor, replay } from "@/entities/editor"
import { createClip, REEL_TRANSITIONS, type ReelClip, type ReelModel, type ReelTransitionKind } from "@/entities/widget"
import { CAMERA_MOVES, cameraMoveOf, playScore, reelDuration } from "@/features/reel"
import { NumberField, Toggle } from "@/shared/ui"

const props = defineProps<{ reel: ReelModel; artboardId: string }>()

// The model is the editor's; this panel edits it in place like the Inspector does.
const reel = computed(() => props.reel)
const total = computed(() => reelDuration(reel.value.clips))
const nameOf = (id: string) => editor.artboards.find((a) => a.id === id)?.name ?? "missing frame"
/** Any frame but a reel can be a clip. */
const candidates = computed(() =>
  editor.artboards.filter((a) => a.id !== props.artboardId && a.widget?.kind !== "reel"),
)
const fmt = (s: number) => `${Math.round(s * 100) / 100}s`

function move(i: number, dir: -1 | 1) {
  const j = i + dir
  const clips = reel.value.clips
  if (j < 0 || j >= clips.length) return
  ;[clips[i], clips[j]] = [clips[j], clips[i]]
}
const remove = (i: number) => reel.value.clips.splice(i, 1)
function add(e: Event) {
  const select = e.target as HTMLSelectElement
  if (select.value) reel.value.clips.push(createClip(select.value))
  select.value = ""
}
const setKind = (i: number, e: Event) => {
  reel.value.clips[i].transition.kind = (e.target as HTMLSelectElement).value as ReelTransitionKind
}
const valueOf = (e: Event) => (e.target as HTMLInputElement | HTMLSelectElement).value

// The film.
function setMove(clip: ReelClip, e: Event) {
  const keys = CAMERA_MOVES[valueOf(e)]
  if (keys) clip.camera = keys.map((k) => ({ ...k }))
}
function setLine(clip: ReelClip, e: Event) {
  const line = valueOf(e)
  if (!line.trim()) clip.chapter = null
  else if (clip.chapter) clip.chapter.line = line
  else clip.chapter = { line, spec: [] }
}
/** Three rows to fill; the model keeps the rows with words. */
const SPEC_ROWS = [0, 1, 2]
function setSpec(clip: ReelClip, row: number, col: 0 | 1, e: Event) {
  if (!clip.chapter) return
  const spec = clip.chapter.spec
  while (spec.length <= row) spec.push(["", ""])
  spec[row][col] = valueOf(e)
}
const addCallout = (clip: ReelClip) =>
  clip.callouts.push({
    x: 0.5,
    y: 0.5,
    label: "Label",
    note: "",
    side: "right",
    from: Math.min(0.6, clip.seconds),
    to: clip.seconds,
  })

const scored = computed(() => reel.value.score !== null)
function setScore(on: boolean) {
  reel.value.score = on ? { seed: reel.value.score?.seed ?? 1 } : null
}
// Previewing the score: synthesized from the cut, played with the reel
// replayed from its start.
const previewing = ref<"idle" | "making" | "playing">("idle")
let stopPreview: (() => void) | null = null
async function preview() {
  if (previewing.value !== "idle") {
    stopPreview?.()
    stopPreview = null
    previewing.value = "idle"
    return
  }
  previewing.value = "making"
  // Let the panel paint its state before the synthesis holds the thread.
  await new Promise((r) => setTimeout(r, 30))
  stopPreview = playScore(reel.value, () => {
    previewing.value = "idle"
    stopPreview = null
  })
  if (!stopPreview) {
    previewing.value = "idle"
    return
  }
  replay()
  previewing.value = "playing"
}
onBeforeUnmount(() => stopPreview?.())
</script>

<template>
  <section class="flex flex-col gap-3">
    <p class="flex gap-2 text-[11.5px] font-medium text-muted-foreground">
      Reel<span class="tabular-nums">{{ fmt(total) }}</span>
    </p>
    <div class="flex flex-wrap items-center gap-2">
      <Toggle :model-value="scored" label="score" @update:model-value="setScore" />
      <NumberField
        v-if="reel.score"
        class="w-24"
        :model-value="reel.score.seed"
        label="seed"
        :min="0"
        :max="99999"
        :step="1"
        @update:model-value="reel.score!.seed = Math.round($event)"
      />
      <button
        v-if="reel.score && reel.clips.length"
        type="button"
        class="clip-tool ml-auto px-2 text-[11px]"
        :aria-pressed="previewing === 'playing' ? 'true' : 'false'"
        @click="preview"
      >
        {{ previewing === "making" ? "Making the score" : previewing === "playing" ? "Stop" : "Play with score" }}
      </button>
    </div>
    <p v-if="!reel.clips.length" class="text-[11px] leading-relaxed text-muted-foreground">
      No clips yet: add frames below, or select frames on the canvas and press Reel.
    </p>
    <article
      v-for="(clip, i) in reel.clips"
      :key="`${clip.id}-${i}`"
      class="flex flex-col gap-2 rounded-md border border-border/60 p-2"
      :data-reel-clip="clip.id"
    >
      <div class="flex items-center gap-1 text-[11px]">
        <span class="w-4 shrink-0 tabular-nums text-muted-foreground">{{ i + 1 }}</span>
        <span class="truncate text-foreground">{{ nameOf(clip.id) }}</span>
        <button
          type="button"
          class="clip-tool ml-auto"
          :disabled="i === 0"
          aria-label="Move clip earlier"
          title="Earlier"
          @click="move(i, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="clip-tool"
          :disabled="i === reel.clips.length - 1"
          aria-label="Move clip later"
          title="Later"
          @click="move(i, 1)"
        >
          ↓
        </button>
        <button
          type="button"
          class="clip-tool text-red-400 hover:bg-red-500/10"
          aria-label="Remove clip"
          title="Remove"
          @click="remove(i)"
        >
          ×
        </button>
      </div>
      <NumberField
        :model-value="clip.seconds"
        label="length"
        :min="0.1"
        :max="600"
        :step="0.5"
        unit="s"
        @update:model-value="clip.seconds = $event"
      />
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-11 shrink-0">in by</span>
        <select :name="`clip-${i}-in`" class="field w-full" :value="clip.transition.kind" @change="setKind(i, $event)">
          <option v-for="k in REEL_TRANSITIONS" :key="k" :value="k">{{ k }}</option>
        </select>
      </label>
      <template v-if="clip.transition.kind !== 'cut'">
        <NumberField
          :model-value="clip.transition.seconds"
          label="over"
          :min="0"
          :max="clip.seconds"
          :step="0.1"
          unit="s"
          @update:model-value="clip.transition.seconds = $event"
        />
        <NumberField
          :model-value="clip.transition.cell"
          label="cell"
          :min="1"
          :max="16"
          :step="1"
          unit="px"
          @update:model-value="clip.transition.cell = $event"
        />
      </template>
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-11 shrink-0">camera</span>
        <select
          :name="`clip-${i}-camera`"
          class="field w-full"
          :value="cameraMoveOf(clip.camera)"
          @change="setMove(clip, $event)"
        >
          <option v-for="(_, name) in CAMERA_MOVES" :key="name" :value="name">{{ name }}</option>
          <option v-if="cameraMoveOf(clip.camera) === 'custom'" value="custom" disabled>custom</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-11 shrink-0">chapter</span>
        <input
          :name="`clip-${i}-chapter`"
          class="field w-full"
          maxlength="80"
          placeholder="a line from this clip on"
          :value="clip.chapter?.line ?? ''"
          @input="setLine(clip, $event)"
        />
      </label>
      <div v-if="clip.chapter" class="grid grid-cols-[4rem_1fr] gap-1 pl-[3.25rem]">
        <template v-for="row in SPEC_ROWS" :key="row">
          <input
            :name="`clip-${i}-spec-${row}-figure`"
            class="field"
            maxlength="12"
            placeholder="264"
            :aria-label="`Spec row ${row + 1} figure`"
            :value="clip.chapter.spec[row]?.[0] ?? ''"
            @input="setSpec(clip, row, 0, $event)"
          />
          <input
            :name="`clip-${i}-spec-${row}-words`"
            class="field"
            maxlength="32"
            placeholder="components"
            :aria-label="`Spec row ${row + 1} words`"
            :value="clip.chapter.spec[row]?.[1] ?? ''"
            @input="setSpec(clip, row, 1, $event)"
          />
        </template>
      </div>
      <details class="text-[11px] text-muted-foreground">
        <summary class="cursor-pointer select-none">callouts {{ clip.callouts.length }}</summary>
        <div class="mt-2 flex flex-col gap-2">
          <div v-for="(c, k) in clip.callouts" :key="k" class="flex flex-col gap-1.5 border-l border-border/60 pl-2">
            <div class="flex gap-1">
              <input
                :name="`clip-${i}-callout-${k}-label`"
                class="field w-full"
                maxlength="48"
                :aria-label="`Callout ${k + 1} label`"
                :value="c.label"
                @input="c.label = valueOf($event)"
              />
              <button
                type="button"
                class="clip-tool text-red-400 hover:bg-red-500/10"
                :aria-label="`Remove callout ${k + 1}`"
                title="Remove"
                @click="clip.callouts.splice(k, 1)"
              >
                ×
              </button>
            </div>
            <input
              :name="`clip-${i}-callout-${k}-note`"
              class="field"
              maxlength="64"
              placeholder="a note under it"
              :aria-label="`Callout ${k + 1} note`"
              :value="c.note"
              @input="c.note = valueOf($event)"
            />
            <NumberField
              :model-value="c.x"
              label="x"
              :min="0"
              :max="1"
              :step="0.01"
              @update:model-value="c.x = $event"
            />
            <NumberField
              :model-value="c.y"
              label="y"
              :min="0"
              :max="1"
              :step="0.01"
              @update:model-value="c.y = $event"
            />
            <NumberField
              :model-value="c.from"
              label="from"
              :min="0"
              :max="clip.seconds"
              :step="0.1"
              unit="s"
              @update:model-value="c.from = $event"
            />
            <NumberField
              :model-value="c.to"
              label="to"
              :min="c.from"
              :max="clip.seconds"
              :step="0.1"
              unit="s"
              @update:model-value="c.to = $event"
            />
            <label class="flex items-center gap-2">
              <span class="w-11 shrink-0">side</span>
              <select
                :name="`clip-${i}-callout-${k}-side`"
                class="field w-full"
                :value="c.side"
                @change="c.side = valueOf($event) as 'left' | 'right'"
              >
                <option value="right">right</option>
                <option value="left">left</option>
              </select>
            </label>
          </div>
          <button
            v-if="clip.callouts.length < 8"
            type="button"
            class="clip-tool self-start px-2"
            @click="addCallout(clip)"
          >
            Add a callout
          </button>
        </div>
      </details>
    </article>
    <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span class="w-11 shrink-0">add</span>
      <select name="add-clip" class="field w-full" @change="add">
        <option value="">frame…</option>
        <option v-for="a in candidates" :key="a.id" :value="a.id">{{ a.name }}</option>
      </select>
    </label>
    <p class="text-[11px] leading-relaxed text-muted-foreground">
      A reel is a video: the video action renders the whole cut as one MP4, as long as the reel, with its score when it
      has one.
    </p>
  </section>
</template>

<style scoped>
.field {
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
  background: color-mix(in oklab, var(--color-background) 60%, transparent);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--color-foreground);
  outline: none;
}
.field:focus-visible {
  border-color: color-mix(in oklab, var(--color-foreground) 40%, transparent);
}
.clip-tool {
  display: grid;
  place-items: center;
  min-width: 1.5rem;
  min-height: 1.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  color: var(--color-muted-foreground);
  transition:
    color 120ms ease,
    background-color 120ms ease;
}
.clip-tool:hover:not(:disabled) {
  color: var(--color-foreground);
}
.clip-tool:disabled {
  opacity: 0.35;
}
.clip-tool:focus-visible,
.field:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 1px;
}
@media (prefers-reduced-motion: reduce) {
  .clip-tool {
    transition: none;
  }
}
</style>
