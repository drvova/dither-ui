<!-- Generated from ../tailwind/CopyableText.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    fontSize: "11px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})
</script>

<script setup lang="ts">
import { cn, type StyleProp } from "./lib"
import Clipboard from "./Clipboard.vue"
import Icon from "./Icon.vue"

/** One-tap copy around a piece of text: the value travels through the shared
 * Clipboard primitive (live-region announcement included), the trigger is an
 * icon button that flips Copy → Check. */
const props = withDefaults(
  defineProps<{ value?: string; label?: string; size?: number; class?: string; xstyle?: StyleProp }>(),
  {
    value: "",
    label: "Copy",
    size: 14,
  },
)
</script>

<template>
  <Clipboard :value="props.value">
    <template #default="{ copied }">
      <button
        type="button"
        :aria-label="copied ? 'Copied' : props.label"
        :class="cn(styles.button, props.xstyle, props.class)"
      >
        <Icon :name="copied ? 'Check' : 'Copy'" :size="size" />
        <slot :copied="copied" />
      </button>
    </template>
  </Clipboard>
</template>
