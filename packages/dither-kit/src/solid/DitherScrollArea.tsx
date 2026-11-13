import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"
import "./DitherScrollArea.css"

export type DitherScrollAreaProps = { class?: string; children?: JSX.Element }

export default function DitherScrollArea(props: DitherScrollAreaProps) {
  return <div class={cn("dk-scroll overflow-auto", props.class)}>{props.children}</div>
}
