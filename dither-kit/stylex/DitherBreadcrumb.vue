<!-- Generated from ../tailwind/DitherBreadcrumb.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

export type Crumb = { label: string; href?: string }

const styles = stylex.create({
  nav: { fontSize: "13px" },
  ol: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" },
  li: { display: "flex", alignItems: "center", gap: "0.375rem" },
  a: {
    marginBlock: "-0.125rem",
    borderRadius: "calc(var(--radius) - 2px)",
    paddingBlock: "0.125rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
      ":focus-visible": "var(--foreground)",
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text: { color: "var(--foreground)" },
  text2: { color: "var(--muted-foreground)" },
  text3: {
    color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    items: Crumb[]
    separator?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { separator: "/" },
)
</script>

<template>
  <nav aria-label="Breadcrumb" :class="cn(styles.nav, props.xstyle, props.class)">
    <ol v-bind="stylex.attrs(styles.ol)">
      <li v-for="(c, i) in items" :key="i" v-bind="stylex.attrs(styles.li)">
        <a v-if="c.href && i < items.length - 1" :href="c.href" v-bind="stylex.attrs(styles.a)">{{ c.label }}</a>
        <span
          v-else
          :aria-current="i === items.length - 1 ? 'page' : undefined"
          :class="cn(i === items.length - 1 ? styles.text : styles.text2)"
          >{{ c.label }}</span
        >
        <span v-if="i < items.length - 1" aria-hidden="true" v-bind="stylex.attrs(styles.text3)">{{
          props.separator
        }}</span>
      </li>
    </ol>
  </nav>
</template>
