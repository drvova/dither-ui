<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { selectedArtboard } from "@/entities/editor"
import { DitherFocusScope } from "@dither-kit"
import { DEFAULT_VIDEO, type VideoOptions } from "./composition"
import { downloadComposition, playerUrl, renderCommand, videoFileName } from "./exportVideo"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const options = ref<VideoOptions>({ ...DEFAULT_VIDEO })
const frame = computed(() => selectedArtboard.value)
const busy = ref(false)
const status = ref("")
const closeRef = ref<HTMLButtonElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v) nextTick(() => closeRef.value?.focus())
  },
  { immediate: true },
)

async function download() {
  if (!frame.value || busy.value) return
  busy.value = true
  status.value = ""
  try {
    status.value = `saved ${await downloadComposition(frame.value, options.value)}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
function preview() {
  if (frame.value) window.open(playerUrl(frame.value, options.value.theme), "_blank", "noopener")
}
async function copyCommand() {
  if (!frame.value) return
  await navigator.clipboard.writeText(renderCommand(frame.value)).then(
    () => (status.value = "command copied"),
    () => (status.value = "clipboard unavailable"),
  )
}
const seconds = computed({
  get: () => options.value.seconds,
  set: (v: number) => (options.value.seconds = Math.min(600, Math.max(1, Number(v) || 1))),
})
</script>

<template>
  <Transition name="dk-fade">
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      aria-label="Export video"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click.self="emit('close')"
      @keydown.esc.stop="emit('close')"
    >
      <DitherFocusScope :autofocus="false" class="flex w-full max-w-md flex-col rounded-xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span class="text-sm font-medium">Export — video</span>
          <button
            ref="closeRef"
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <div v-if="frame" class="grid gap-4 p-4 text-[12px]">
          <p class="m-0 text-muted-foreground">
            <span class="text-foreground">{{ frame.name }}</span> · {{ frame.w }}×{{ frame.h }} — the frame is the video frame. For 1080p, size it 960×540 and render with <code class="text-foreground">--resolution landscape</code> (an integer upscale, finer dither, same design).
          </p>

          <div class="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
            <label for="video-seconds" class="text-muted-foreground">length</label>
            <div class="flex items-center gap-2">
              <input id="video-seconds" v-model.number="seconds" type="number" min="1" max="600" step="0.5" name="video-seconds" class="field w-20" />
              <span class="text-muted-foreground">seconds</span>
            </div>

            <span id="video-fps-label" class="text-muted-foreground">frame rate</span>
            <div class="flex gap-1" role="group" aria-labelledby="video-fps-label">
              <button v-for="f in [24, 30, 60] as const" :key="f" type="button" class="chip" :aria-pressed="options.fps === f" @click="options.fps = f">{{ f }} fps</button>
            </div>

            <span id="video-theme-label" class="text-muted-foreground">theme</span>
            <div class="flex gap-1" role="group" aria-labelledby="video-theme-label">
              <button v-for="t in ['dark', 'light'] as const" :key="t" type="button" class="chip" :aria-pressed="options.theme === t" @click="options.theme = t">{{ t }}</button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="action is-primary" :disabled="busy" @click="download">{{ busy ? "building…" : `download ${videoFileName(frame)}` }}</button>
            <button type="button" class="action" @click="preview">preview</button>
            <button type="button" class="action" @click="copyCommand">copy render command</button>
          </div>
          <p class="m-0 min-h-4 text-muted-foreground" aria-live="polite">{{ status }}</p>

          <p class="m-0 leading-relaxed text-muted-foreground">
            A <a href="https://github.com/heygen-com/hyperframes" target="_blank" rel="noreferrer" class="underline underline-offset-2 text-foreground">HyperFrames</a> composition: one self-contained HTML file.
            Render it with <code class="text-foreground">{{ renderCommand(frame) }}</code> (Node 22 + FFmpeg).
            Same seeds, same time, same pixels on every run; simulation backgrounds render with <code class="text-foreground">--workers 1</code>.
            Your coding agent can do this too: ask it to export the frame as a video.
          </p>
        </div>
        <p v-else class="m-0 p-4 text-[12px] text-muted-foreground">Select a frame first.</p>
      </DitherFocusScope>
    </div>
  </Transition>
</template>

<style scoped>
.field { height: 1.75rem; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-background); padding-inline: 0.5rem; font: inherit; color: var(--color-foreground); outline: none; }
.field:focus-visible { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.chip { border: 1px solid var(--color-border); border-radius: 0.375rem; padding: 3px 9px; color: var(--color-muted-foreground); transition: color 120ms ease, background-color 120ms ease; }
.chip:hover { color: var(--color-foreground); }
.chip[aria-pressed="true"] { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-foreground); }
.action { border: 1px solid var(--color-border); border-radius: 0.375rem; padding: 5px 10px; color: var(--color-muted-foreground); transition: color 120ms ease; }
.action:hover:not(:disabled) { color: var(--color-foreground); }
.action:disabled { opacity: 0.6; }
.action.is-primary { color: var(--color-foreground); border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.chip:focus-visible, .action:focus-visible, .field:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.dk-fade-enter-active, .dk-fade-leave-active { transition: opacity 160ms ease; }
.dk-fade-enter-from, .dk-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .dk-fade-enter-active, .dk-fade-leave-active, .chip, .action { transition: none; } }
</style>
