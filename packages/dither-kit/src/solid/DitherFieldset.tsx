import type { JSX } from "solid-js"

export type DitherFieldsetProps = { legend: string; children?: JSX.Element }

export default function DitherFieldset(props: DitherFieldsetProps) {
  return (
    <fieldset class="rounded-lg border border-border/60 p-4">
      <legend class="px-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{props.legend}</legend>
      <div class="grid gap-4">{props.children}</div>
    </fieldset>
  )
}
