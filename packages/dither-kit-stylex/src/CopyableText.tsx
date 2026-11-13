// Generated from dither-kit/solid/CopyableText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import Clipboard from "./Clipboard"
import Icon from "./Icon"
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

/** One-tap copy around a piece of text: the value travels through the shared
 * Clipboard primitive (live-region announcement included), the trigger is an
 * icon button that flips Copy → Check. */
export type CopyableTextProps = {
  value?: string
  label?: string
  size?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element | ((scope: { readonly copied: boolean }) => JSX.Element)
}

export default function CopyableText(raw: CopyableTextProps) {
  const props = mergeProps({ value: "", label: "Copy", size: 14 }, raw)
  return (
    <Clipboard value={props.value}>
      {(scope) => (
        <button
          type="button"
          aria-label={scope.copied ? "Copied" : props.label}
          class={cn(styles.button, props.xstyle, props.class)}
        >
          <Icon name={scope.copied ? "Check" : "Copy"} size={props.size} />
          {(() => {
            const slot = props.children
            return typeof slot === "function" ? slot(scope) : slot
          })()}
        </button>
      )}
    </Clipboard>
  )
}
