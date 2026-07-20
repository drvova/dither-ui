<script lang="ts" module>
  export type Step = { label: string; hint?: string }
</script>

<script lang="ts">
  import { cn } from "./lib"
  import DitherSeparator from "./DitherSeparator.svelte"

  type Props = {
    steps: Step[]
    current: number // index of the active step
    class?: string
  }

  let { steps, current, class: className }: Props = $props()

  const stepState = (i: number) =>
    i < current ? "done" : i === current ? "active" : "todo"
</script>

<!-- svelte-ignore a11y_no_redundant_roles (list-style:none can drop list semantics; role=list restores them) -->
<ol class={cn("flex items-start", className)} role="list" aria-label="Progress">
  {#each steps as s, i (i)}
    <li
      class="flex flex-1 flex-col items-center"
      aria-current={i === current ? "step" : undefined}
    >
      <div class="flex w-full items-center">
        {#if i > 0}
          <DitherSeparator
            class={cn("flex-1", stepState(i) === "todo" ? "opacity-30" : "")}
          />
        {:else}
          <span class="flex-1"></span>
        {/if}
        <span
          class={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums transition-colors",
            stepState(i) === "done" && "border-foreground/30 bg-foreground/10 text-foreground",
            stepState(i) === "active" && "border-foreground bg-background text-foreground",
            stepState(i) === "todo" && "border-border text-muted-foreground"
          )}
        >
          {#if stepState(i) === "done"}
            <svg
              viewBox="0 0 24 24"
              class="size-3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          {:else}
            {i + 1}
          {/if}
        </span>
        {#if i < steps.length - 1}
          <DitherSeparator
            class={cn(
              "flex-1",
              stepState(i + 1) === "todo" && stepState(i) !== "active"
                ? "opacity-30"
                : stepState(i) === "todo"
                  ? "opacity-30"
                  : ""
            )}
          />
        {:else}
          <span class="flex-1"></span>
        {/if}
      </div>
      <span
        class={cn(
          "mt-2 text-center text-[12px]",
          i === current ? "text-foreground" : "text-muted-foreground"
        )}>{s.label}</span
      >
      {#if s.hint}
        <span class="text-center text-[11px] text-muted-foreground/60">{s.hint}</span>
      {/if}
    </li>
  {/each}
</ol>
