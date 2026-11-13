import type { JSX } from "solid-js"
import { cn } from "../tailwind/lib"

/** Addon slots around a control — prefix/suffix text, icons or buttons in
 * one bordered group. The inner control drops its own chrome (the docs
 * snippet shows the exact class set); the group owns the border and the
 * focus-within ring. */
export type InputGroupProps = {
  class?: string
  prefix?: JSX.Element
  suffix?: JSX.Element
  children?: JSX.Element
}

export default function InputGroup(props: InputGroupProps) {
  return (
    <div
      class={cn(
        "flex w-full items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 transition-[border-color,box-shadow] focus-within:border-ring motion-reduce:transition-none",
        props.class,
      )}
    >
      <span class="shrink-0 text-[12px] text-muted-foreground">{props.prefix}</span>
      {props.children}
      <span class="shrink-0 text-[12px] text-muted-foreground">{props.suffix}</span>
    </div>
  )
}
