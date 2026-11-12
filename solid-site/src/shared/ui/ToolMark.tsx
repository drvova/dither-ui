// A tool's mark (marks.ts) in currentColor. Always decorative: the tool's
// name is the text beside it. Imported by path, never through the shared/ui
// barrel: the barrel would pull every shared component (and its CSS) into
// the landing's first load.
import { For, type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "@dither-kit/tailwind/lib"
import { MARKS, type MarkId } from "@/shared/ui/marks"
import "./ToolMark.css"

type Own = { id: MarkId; size?: number; class?: string }
export type ToolMarkProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

export default function ToolMark(raw: ToolMarkProps) {
  const merged = mergeProps({ size: 14 }, raw)
  const [props, rest] = splitProps(merged, ["id", "size", "class"])
  return (
    <svg
      {...rest}
      viewBox={MARKS[props.id].viewBox}
      width={props.size}
      height={props.size}
      fill="currentColor"
      fill-rule={"evenodd" in MARKS[props.id] ? "evenodd" : undefined}
      aria-hidden="true"
      {...{ focusable: "false" }}
      class={cn("tool-mark-scope tool-mark", props.class)}
    >
      <For each={MARKS[props.id].d}>{(d) => <path d={d} />}</For>
    </svg>
  )
}
