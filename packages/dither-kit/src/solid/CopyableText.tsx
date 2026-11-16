import { type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import Clipboard from "./Clipboard"
import Icon from "./Icon"

/** One-tap copy around a piece of text: the value travels through the shared
 * Clipboard primitive (live-region announcement included), the trigger is an
 * icon button that flips Copy → Check. */
export type CopyableTextProps = {
  /** @default required */
  value?: string
  /** @docs string (aria) */
  label?: string
  /** @docs number (px) */
  size?: number
  class?: string
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
          class={cn(
            "inline-flex items-center gap-1.5 rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
            props.class,
          )}
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
