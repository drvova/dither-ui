<script setup lang="ts">
import { computed, ref } from "vue"
import { copyText, DitherIcon } from "@dither-kit"
import { type Inline, parseProse } from "../model/prose"

// A reply set as prose: its blocks as elements, never as HTML.
const props = defineProps<{ text: string; live?: boolean }>()
const blocks = computed(() => parseProse(props.text))
const last = computed(() => blocks.value.length - 1)
type Line = Inline[]
/** The code block just copied, by its place, for a moment. */
const copied = ref<number | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
async function copy(at: number, text: string) {
  if (!(await copyText(text))) return
  copied.value = at
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = null), 1600)
}
</script>

<template>
  <div class="prose">
    <template v-for="(b, i) in blocks" :key="i">
      <component :is="`h${b.level + 2}`" v-if="b.kind === 'heading'" class="h">
        <template v-for="(s, j) in b.inline" :key="j"
          ><code v-if="s.kind === 'code'">{{ s.text }}</code
          ><strong v-else-if="s.kind === 'strong'">{{ s.text }}</strong
          ><template v-else>{{ s.text }}</template></template
        >
      </component>
      <component :is="b.ordered ? 'ol' : 'ul'" v-else-if="b.kind === 'list'">
        <li v-for="(item, j) in b.items as Line[]" :key="j">
          <template v-for="(s, k) in item" :key="k"
            ><code v-if="s.kind === 'code'">{{ s.text }}</code
            ><strong v-else-if="s.kind === 'strong'">{{ s.text }}</strong
            ><template v-else>{{ s.text }}</template></template
          >
        </li>
      </component>
      <div v-else-if="b.kind === 'code'" class="code">
        <pre :data-lang="b.lang || undefined"><code>{{ b.text }}</code></pre>
        <button
          v-if="!live || i !== last"
          type="button"
          class="row-key code-copy"
          :aria-label="copied === i ? 'Copied' : 'Copy code'"
          :title="copied === i ? 'Copied' : 'Copy code'"
          @click="copy(i, b.text)"
        >
          <DitherIcon :name="copied === i ? 'Check' : 'Copy'" :size="12" :stroke-width="1.5" />
        </button>
      </div>
      <p v-else>
        <template v-for="(s, j) in b.inline" :key="j"
          ><code v-if="s.kind === 'code'">{{ s.text }}</code
          ><strong v-else-if="s.kind === 'strong'">{{ s.text }}</strong
          ><template v-else>{{ s.text }}</template></template
        ><span v-if="live && i === last" class="caret" aria-hidden="true"></span>
      </p>
    </template>
    <p v-if="live && !blocks.length"><span class="caret" aria-hidden="true"></span></p>
  </div>
</template>

<style scoped>
/* The reply reads in the proportional face (the user's call for the
   thread's prose); code stays in the mono. */
.prose {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
}
.prose :is(p, ul, ol, pre, .h) {
  margin: 0;
}
.h {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
}
ul,
ol {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3px;
  padding-left: 1.1rem;
  list-style: disc;
}
ol {
  list-style: decimal;
}
li::marker {
  color: var(--color-muted-foreground);
}
code {
  font-family: var(--font-mono);
  border-radius: 4px;
  padding: 0.5px 4px;
  font-size: 0.92em;
  background: color-mix(in oklab, var(--color-foreground) 8%, transparent);
}
pre {
  overflow-x: auto;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.5;
  background: var(--well);
  box-shadow: var(--recess-sm);
}
.code {
  position: relative;
}
.code-copy {
  position: absolute;
  top: 3px;
  right: 3px;
  opacity: 0;
  background: var(--well);
  transition: opacity 200ms var(--ease-settle);
}
.code:hover .code-copy,
.code-copy:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .code-copy {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .code-copy {
    transition: none;
  }
}
pre code {
  padding: 0;
  background: none;
}
.caret {
  display: inline-block;
  width: 6px;
  height: 1.1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--color-foreground);
}
@media (prefers-reduced-motion: no-preference) {
  .caret {
    animation: blink 1.1s steps(2, start) infinite;
  }
  @keyframes blink {
    to {
      visibility: hidden;
    }
  }
}
</style>
