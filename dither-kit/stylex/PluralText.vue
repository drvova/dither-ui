<!-- Generated from ../tailwind/PluralText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"

/** Intl.PluralRules as a slot switch: the category (one/few/many/other…)
 * picks the slot, the default slot is the fallback, and every slot receives
 * `count` so the sentence can place it. Languages with richer plural
 * categories just get more named slots — no conditionals in the caller. */
const props = withDefaults(defineProps<{ count?: number; locale?: string; class?: string; xstyle?: StyleProp }>(), {
  count: 0,
  locale: "en",
})

const category = computed(() => new Intl.PluralRules(props.locale).select(props.count))
</script>

<template>
  <span :class="cn(props.xstyle, props.class)">
    <slot :name="category" :count="props.count"><slot :count="props.count" /></slot>
  </span>
</template>
