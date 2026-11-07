<script lang="ts">
  // The pause control of a surface that moves by itself (WCAG 2.2.2): a round
  // toggle button (stable name, `aria-pressed` while paused) whose glyph
  // turns pause into play. 32px, past the 24px target floor.
  let {
    playing = $bindable(),
    label,
    class: className,
  }: { playing: boolean; label: string; class?: string } = $props()
</script>

<button
  type="button"
  class={["pause-chip", className]}
  aria-pressed={!playing}
  aria-label={label}
  onclick={() => (playing = !playing)}
>
  <span class="pause-glyph" data-paused={playing ? undefined : "true"} aria-hidden="true"></span>
</button>

<style>
  /* A disc of the page's ink over the surface, its glyph in the page's ground. */
  .pause-chip {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    color: var(--background);
    background: var(--ink);
    cursor: pointer;
    transition: background-color 150ms var(--ease-settle);
  }

  .pause-chip:hover {
    background: color-mix(in oklab, var(--ink) 78%, var(--background));
  }

  /* Pause: two bars. Play: a triangle. */
  .pause-glyph {
    width: 10px;
    height: 10px;
    background:
      linear-gradient(currentColor, currentColor) left / 3px 100% no-repeat,
      linear-gradient(currentColor, currentColor) right / 3px 100% no-repeat;
  }

  .pause-glyph[data-paused] {
    background: currentColor;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }
</style>
