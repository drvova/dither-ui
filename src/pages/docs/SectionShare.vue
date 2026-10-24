<script setup lang="ts">
// The section in view, to share: under "On this page", a disclosure that
// shows the section's share card playing (the GIF the build draws at
// og/<id>.gif, the one Discord and Slack play) and copies the section as a
// link, or the card as a Markdown or HTML image that links back, for a
// README, an issue or a post. The card loads only once the disclosure is
// open; where no build drew it (dev) the image hides itself.
import { computed, ref, watch } from "vue"
import { copyText, DitherIcon } from "@dither-kit"
import { assetPath } from "@/shared/lib"
import { play } from "@/shared/lib/sound"
import { docsMeta, SITE_URL } from "./seo"

const props = defineProps<{ id: string }>()

const open = ref(false)
const gone = ref(false)
const copied = ref("")
const said = ref("")
let timer: ReturnType<typeof setTimeout> | undefined

const meta = computed(() => docsMeta(props.id))
const card = computed(() => `${SITE_URL}/og/${props.id}.gif`)
const alt = computed(() => `${meta.value.label} in the dither-ui docs`)
const SNIPPETS = computed(() => [
  { id: "link", icon: "Link" as const, label: "Copy link", text: meta.value.url },
  {
    id: "markdown",
    icon: "Code" as const,
    label: "Copy Markdown",
    text: `[![${alt.value}](${card.value})](${meta.value.url})`,
  },
  {
    id: "html",
    icon: "Image" as const,
    label: "Copy HTML",
    text: `<a href="${meta.value.url}"><img src="${card.value}" alt="${alt.value}" width="600" height="315"></a>`,
  },
])

watch(
  () => props.id,
  () => {
    gone.value = false
    copied.value = ""
  },
)

async function copy(s: { id: string; label: string; text: string }) {
  if (!(await copyText(s.text))) return
  play("copy")
  copied.value = s.id
  said.value = `${s.label.replace("Copy ", "")} copied`
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = ""), 1500)
}
</script>

<template>
  <div class="mt-8">
    <button
      type="button"
      class="flex min-h-6 items-center gap-2 text-left text-[11px] font-medium text-foreground"
      :aria-expanded="open ? 'true' : 'false'"
      aria-controls="section-share"
      @click="open = !open"
    >
      <DitherIcon name="Share" :size="13" :stroke-width="1.5" />Share<span class="sr-only"> this section</span>
    </button>
    <div v-if="open" id="section-share" class="mt-2.5 grid gap-1">
      <img
        v-if="!gone"
        :src="assetPath(`/og/${id}.gif`)"
        :alt="`The ${meta.label} card, playing`"
        width="160"
        height="84"
        decoding="async"
        class="mb-1.5 block h-auto w-full rounded-[6px] ring-1 ring-border/60"
        @error="gone = true"
      />
      <button
        v-for="s in SNIPPETS"
        :key="s.id"
        type="button"
        class="flex min-h-6 items-center gap-2 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        @click="copy(s)"
      >
        <DitherIcon :name="copied === s.id ? 'Check' : s.icon" :size="12" :stroke-width="1.5" />{{
          copied === s.id ? "Copied" : s.label
        }}
      </button>
      <span class="sr-only" aria-live="polite">{{ said }}</span>
    </div>
  </div>
</template>
