// A tool's mark (marks.ts) in currentColor, the sprite's (`sprite.ts`), so
// no page carries its paths. Always decorative: the tool's name is the text
// beside it. Imported by path, never through the shared/ui barrel: the
// barrel would pull every shared component (and its CSS) into the
// landing's first load.
import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import type { MarkId } from "@/shared/ui/marks"
import { markSymbol, spriteRef } from "@/shared/ui/sprite"
import "./ToolMark.css"

type Own = { id: MarkId; size?: number; class?: string }
type ToolMarkProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

export default function ToolMark(raw: ToolMarkProps) {
  const merged = mergeProps({ size: 14 }, raw)
  const [props, rest] = splitProps(merged, ["id", "size", "class"])
  return (
    <svg
      {...rest}
      width={props.size}
      height={props.size}
      fill="currentColor"
      aria-hidden="true"
      {...{ focusable: "false" }}
      class={cn("tool-mark-scope tool-mark", props.class)}
    >
      <use href={spriteRef(markSymbol(props.id))} />
    </svg>
  )
}
