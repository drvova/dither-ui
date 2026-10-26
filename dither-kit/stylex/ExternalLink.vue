<!-- Generated from ../tailwind/ExternalLink.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  link: { display: "inline-flex", alignItems: "center", gap: "0.25rem" },
  icon: { flexShrink: "0", opacity: "70%" },
})
</script>

<script setup lang="ts">
import { type StyleProp } from "./lib"
import Link from "./Link.vue"
import Icon from "./Icon.vue"

/** External link: new-tab semantics done right (`target=_blank rel=noreferrer`)
 * plus the ExternalLink glyph after the label — the pattern every outbound
 * link in this kit follows. */
const props = withDefaults(defineProps<{ href: string; iconSize?: number; class?: string; xstyle?: StyleProp }>(), {
  iconSize: 12,
})
</script>

<template>
  <Link :href="props.href" external :xstyle="[styles.link, props.xstyle, props.class]">
    <slot />
    <Icon name="ExternalLink" :size="iconSize" :xstyle="styles.icon" />
  </Link>
</template>
