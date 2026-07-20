<script lang="ts">
  import { cn } from "../runtime/lib"
  import { inView } from "../runtime/in-view"

  type Props = {
    text?: string
    by?: "words" | "chars"
    stagger?: number
    duration?: number
    class?: string
  }

  let {
    text = "Blur into focus",
    by = "words",
    stagger = 90,
    duration = 600,
    class: className,
  }: Props = $props()

  const parts = $derived(by === "chars" ? [...text] : text.split(/(\s+)/))
  let shown = $state(false)
</script>

<span use:inView={() => (shown = true)} class={cn("inline-block", className)} aria-label={text}>
  {#each parts as p, i (i)}
    <span
      aria-hidden="true"
      class="dither-blur-part"
      class:shown
      style:transition-delay="{i * stagger}ms"
      style:transition-duration="{duration}ms">{p.trim() === "" ? "\u00a0" : p}</span>
  {/each}
</span>

<style>
  .dither-blur-part {
    display: inline-block;
    white-space: pre;
    opacity: 0;
    filter: blur(8px);
    transform: translateY(6px);
    transition-property: opacity, filter, transform;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .dither-blur-part.shown {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-blur-part {
      opacity: 1;
      filter: none;
      transform: none;
      transition: none;
    }
  }
</style>
