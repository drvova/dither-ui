<script setup lang="ts">
// A film's chapter band: the line on the left, the spec list beside it (each
// row's figure first, in the foreground, its words muted). A new chapter
// comes in over the one before through the kit's ordered-dither dissolve.
// The band is a size container: its type scales with the reel's frame.
import { DitherReveal } from "@dither-kit"
import type { ReelChapter } from "@/entities/widget"
import type { ChapterState } from "@/features/reel"

defineProps<{ state: ChapterState; reduced: boolean }>()

const layersOf = (s: ChapterState, reduced: boolean): { chapter: ReelChapter; progress: number; key: string }[] =>
  s.previous && s.progress < 1 && !reduced
    ? [
        { chapter: s.previous, progress: 1, key: "previous" },
        { chapter: s.chapter, progress: s.progress, key: "current" },
      ]
    : [{ chapter: s.chapter, progress: 1, key: "current" }]
</script>

<template>
  <div class="reel-band relative border-t border-border bg-background" :data-reel-chapter="state.chapter.line">
    <DitherReveal
      v-for="layer in layersOf(state, reduced)"
      :key="layer.key"
      class="absolute inset-0 bg-background"
      :progress="layer.progress"
      direction="none"
      :cell="6"
    >
      <div class="band-grid h-full">
        <p class="band-line text-foreground">{{ layer.chapter.line }}</p>
        <ul class="band-spec">
          <li v-for="(row, i) in layer.chapter.spec" :key="i">
            <span v-if="row[0]" class="text-foreground">{{ row[0] }}</span
            ><span class="text-muted-foreground">{{ row[1] }}</span>
          </li>
        </ul>
      </div>
    </DitherReveal>
  </div>
</template>

<style scoped>
.reel-band {
  container-type: size;
  font-family: var(--font-mono);
}
.band-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  align-items: center;
  gap: 6cqh;
  padding: 0 4cqw;
}
.band-line {
  margin: 0;
  font-size: 24cqh;
  line-height: 1.18;
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.band-spec {
  margin: 0;
  padding: 0 0 0 4cqw;
  list-style: none;
  border-left: 1px solid var(--border);
  font-size: 11cqh;
  line-height: 1.7;
  white-space: nowrap;
  overflow: hidden;
}
.band-spec span + span {
  margin-left: 0.6em;
}
</style>
