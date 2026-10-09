<script setup lang="ts">
// The reel's cut: its clips in order, each with its length and the
// transition it comes in by; reorder or drop them here, add frames from the
// picker. The timeline itself is features/reel — this panel only edits the model.
import { computed } from "vue"
import { editor } from "@/entities/editor"
import { createClip, REEL_TRANSITIONS, type ReelModel, type ReelTransitionKind } from "@/entities/widget"
import { reelDuration } from "@/features/reel"
import { NumberField } from "@/shared/ui"

const props = defineProps<{ reel: ReelModel; artboardId: string }>()

// The model is the editor's; this panel edits it in place like the Inspector does.
const reel = computed(() => props.reel)
const total = computed(() => reelDuration(reel.value.clips))
const nameOf = (id: string) => editor.artboards.find((a) => a.id === id)?.name ?? "missing frame"
/** Any frame but a reel can be a clip. */
const candidates = computed(() => editor.artboards.filter((a) => a.id !== props.artboardId && a.widget?.kind !== "reel"))
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
</script>

<template>
  <section class="flex flex-col gap-3">
    <p class="text-[10px] uppercase tracking-widest text-muted-foreground">reel · {{ fmt(total) }}</p>
    <p v-if="!reel.clips.length" class="text-[11px] leading-relaxed text-muted-foreground">No clips yet: add frames below, or select frames on the canvas and press reel.</p>
    <article v-for="(clip, i) in reel.clips" :key="`${clip.id}-${i}`" class="flex flex-col gap-2 rounded-md border border-border/60 p-2" :data-reel-clip="clip.id">
      <div class="flex items-center gap-1 text-[11px]">
        <span class="w-4 shrink-0 tabular-nums text-muted-foreground">{{ i + 1 }}</span>
        <span class="truncate text-foreground">{{ nameOf(clip.id) }}</span>
        <button type="button" class="clip-tool ml-auto" :disabled="i === 0" aria-label="Move clip earlier" title="Earlier" @click="move(i, -1)">↑</button>
        <button type="button" class="clip-tool" :disabled="i === reel.clips.length - 1" aria-label="Move clip later" title="Later" @click="move(i, 1)">↓</button>
        <button type="button" class="clip-tool text-red-400 hover:bg-red-500/10" aria-label="Remove clip" title="Remove" @click="remove(i)">×</button>
      </div>
      <NumberField :model-value="clip.seconds" label="length" :min="0.1" :max="600" :step="0.5" unit="s" @update:model-value="clip.seconds = $event" />
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-11 shrink-0">in by</span>
        <select :name="`clip-${i}-in`" class="field w-full" :value="clip.transition.kind" @change="setKind(i, $event)">
          <option v-for="k in REEL_TRANSITIONS" :key="k" :value="k">{{ k }}</option>
        </select>
      </label>
      <template v-if="clip.transition.kind !== 'cut'">
        <NumberField :model-value="clip.transition.seconds" label="over" :min="0" :max="clip.seconds" :step="0.1" unit="s" @update:model-value="clip.transition.seconds = $event" />
        <NumberField :model-value="clip.transition.cell" label="cell" :min="1" :max="16" :step="1" unit="px" @update:model-value="clip.transition.cell = $event" />
      </template>
    </article>
    <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span class="w-11 shrink-0">add</span>
      <select name="add-clip" class="field w-full" @change="add">
        <option value="">frame…</option>
        <option v-for="a in candidates" :key="a.id" :value="a.id">{{ a.name }}</option>
      </select>
    </label>
    <p class="text-[11px] leading-relaxed text-muted-foreground">A reel is a video: the video action renders the whole cut as one MP4, as long as the reel.</p>
  </section>
</template>

<style scoped>
.field { border-radius: 0.375rem; border: 1px solid var(--color-border); background: color-mix(in oklab, var(--color-background) 60%, transparent); padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--color-foreground); outline: none; }
.field:focus-visible { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.clip-tool { display: grid; place-items: center; min-width: 1.5rem; min-height: 1.5rem; border-radius: 0.25rem; border: 1px solid var(--color-border); color: var(--color-muted-foreground); transition: color 120ms ease, background-color 120ms ease; }
.clip-tool:hover:not(:disabled) { color: var(--color-foreground); }
.clip-tool:disabled { opacity: 0.35; }
.clip-tool:focus-visible, .field:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) { .clip-tool { transition: none; } }
</style>
