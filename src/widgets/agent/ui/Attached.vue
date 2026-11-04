<script setup lang="ts">
import { DitherIcon } from "@dither-kit"
import { type Attachment, chipOf } from "../model/compose"

// What the message carries besides its words, as chips beside its frames:
// a picture with its thumbnail and size, a pasted or dropped text with its
// lines (pressed, it goes back into the field as typed text).
defineProps<{ attachments: Attachment[] }>()
const emit = defineEmits<{ remove: [id: string]; unfold: [id: string] }>()
</script>

<template>
  <span v-for="a in attachments" :key="a.id" class="ctx first-line" :data-kind="a.kind"
    ><img
      v-if="a.kind === 'image'"
      class="thumb"
      :src="`data:${a.mimeType};base64,${a.data}`"
      alt=""
      width="14"
      height="14" /><DitherIcon
      v-else
      :name="a.kind === 'quote' ? 'Bookmark' : 'File'"
      :size="11"
      :stroke-width="1.5" /><button
      v-if="a.kind === 'text'"
      type="button"
      class="unfold row-label is-wrap"
      :title="`Put ${a.name} back in the field as text`"
      @click="emit('unfold', a.id)"
    >
      {{ chipOf(a).name }} <span class="dim">{{ chipOf(a).detail }}</span></button
    ><span v-else class="row-label is-wrap"
      >{{ chipOf(a).name }} <span class="dim">{{ chipOf(a).detail }}</span></span
    ><button type="button" class="ctx-x" :aria-label="`Remove ${a.name}`" @click="emit('remove', a.id)">
      <DitherIcon name="Close" :size="10" :stroke-width="1.5" /></button
  ></span>
</template>

<style scoped>
.thumb {
  --glyph: 14px;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  object-fit: cover;
}
.unfold {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.unfold:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.unfold:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
  border-radius: 2px;
}
.dim {
  color: var(--color-muted-foreground);
}
</style>
