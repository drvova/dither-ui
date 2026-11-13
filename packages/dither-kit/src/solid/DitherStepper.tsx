import { For, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherSeparator from "./DitherSeparator"

export type Step = { label: string; hint?: string }

export type DitherStepperProps = {
  steps: Step[]
  current: number // index of the active step
  class?: string
}

export default function DitherStepper(props: DitherStepperProps) {
  const state = (i: number) => (i < props.current ? "done" : i === props.current ? "active" : "todo")

  return (
    <ol class={cn("flex items-start", props.class)} role="list" aria-label="Progress">
      <For each={props.steps}>
        {(s, i) => (
          <li class="flex flex-1 flex-col items-center" aria-current={i() === props.current ? "step" : undefined}>
            <div class="flex w-full items-center">
              <Show when={i() > 0} fallback={<span class="flex-1" />}>
                <DitherSeparator class={state(i()) === "todo" ? "flex-1 opacity-30" : "flex-1"} />
              </Show>
              <span
                class={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums transition-colors",
                  state(i()) === "done" && "border-foreground/30 bg-foreground/10 text-foreground",
                  state(i()) === "active" && "border-foreground bg-background text-foreground",
                  state(i()) === "todo" && "border-border text-muted-foreground",
                )}
              >
                <Show when={state(i()) === "done"} fallback={i() + 1}>
                  <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </Show>
              </span>
              <Show when={i() < props.steps.length - 1} fallback={<span class="flex-1" />}>
                <DitherSeparator
                  class={cn(
                    "flex-1",
                    ((state(i() + 1) === "todo" && state(i()) !== "active") || state(i()) === "todo") && "opacity-30",
                  )}
                />
              </Show>
            </div>
            <span
              class={cn(
                "mt-2 text-center text-[12px]",
                i() === props.current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            <Show when={s.hint}>
              <span class="text-center text-[11px] text-muted-foreground">{s.hint}</span>
            </Show>
          </li>
        )}
      </For>
    </ol>
  )
}
