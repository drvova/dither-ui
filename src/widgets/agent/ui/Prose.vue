<script setup lang="ts">
import { computed } from "vue"
import { type Inline, parseProse } from "../model/prose"

// A reply set as prose: its blocks as elements, never as HTML.
const props = defineProps<{ text: string; live?: boolean }>()
const blocks = computed(() => parseProse(props.text))
const last = computed(() => blocks.value.length - 1)
type Line = Inline[]
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
      <pre v-else-if="b.kind === 'code'" :data-lang="b.lang || undefined"><code>{{ b.text }}</code></pre>
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
.prose {
  display: grid;
  gap: 8px;
  font-size: 12.5px;
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
