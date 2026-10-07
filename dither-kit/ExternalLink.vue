<script setup lang="ts">
import { cn } from "./lib"
import Link from "./Link.vue"
import Icon from "./Icon.vue"

/** External link: new-tab semantics done right (`target=_blank rel=noreferrer`)
 * plus the ExternalLink glyph after the label — the pattern every outbound
 * link in this kit follows. */
const props = withDefaults(
  defineProps<{ href: string; iconSize?: number; class?: string }>(),
  { iconSize: 12 },
)
</script>

<template>
  <Link :href="props.href" external :class="cn('inline-flex items-center gap-1', props.class)">
    <slot />
    <Icon name="ExternalLink" :size="iconSize" class="shrink-0 opacity-70" />
  </Link>
</template>
