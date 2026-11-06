<script lang="ts">
  // The ask as a story: a stage pinned while the page scrolls past it plays
  // one agent session (`story.ts`), a step per notch, composed as the Vue
  // landing's is (see `src/pages/AGENTS.md`, Ask): corner bleed, the session
  // at the left like copy (the ask as the sent message, the line at work
  // under a spinner, the done ones under an ember cell), the Deploys screen
  // the hero at the right, running off the stage's right edge and foot, its
  // parts resolving in their slots. The step is the marker crossing the
  // viewport's middle (one IntersectionObserver, no scroll listener). Under
  // 900px, or without an observer, the stage is not pinned and shows the
  // last step. Screen readers get the whole session as a caption; the stage
  // that plays it is decoration, but for the screen's switch, a real control.
  import { onDestroy, onMount, tick } from "svelte"
  import { DitherProgress, DitherSpinner, DitherSwitch, Sparkline } from "@dither-kit-svelte"
  import { ASK, DAYS, DEPLOYS, DOES, lineState, PARTS, RENDER, STEPS } from "./story"

  const LAST = STEPS - 1
  const TOLD = DOES.map((d) => d[0].toLowerCase() + d.slice(1))

  let step = $state(LAST)
  let pinned = $state(false)
  let auto = $state(true)

  const markers: HTMLElement[] = []
  let io: IntersectionObserver | null = null
  let wide: MediaQueryList | null = null
  const inBand = new Set<number>()

  async function arm() {
    io?.disconnect()
    io = null
    inBand.clear()
    pinned = typeof IntersectionObserver !== "undefined" && (wide?.matches ?? false)
    if (!pinned) {
      step = LAST
      return
    }
    step = 0
    // The markers render with the pin: observe them once they are there.
    await tick()
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = markers.indexOf(e.target as HTMLElement)
          if (i < 0) continue
          if (e.isIntersecting) inBand.add(i)
          else inBand.delete(i)
        }
        if (inBand.size) step = Math.max(...inBand)
      },
      { rootMargin: "-50% 0px -50% 0px" }
    )
    for (const m of markers) io.observe(m)
  }

  onMount(() => {
    wide = window.matchMedia("(min-width: 900px)")
    wide.addEventListener("change", arm)
    arm()
  })
  onDestroy(() => {
    wide?.removeEventListener("change", arm)
    io?.disconnect()
  })
</script>

<div class={["story", pinned && "pinned"]} style:--steps={STEPS}>
  <figure id="agent-ask" class="pin">
    <div class="stage">
      <!-- The session as it plays: decoration over the caption. -->
      <div class="session" aria-hidden="true">
        <p class="ask">{ASK}</p>
        <ol class="does">
          {#each DOES as line, i (line)}
            <li class={lineState(i, step)}>
              <span class="mark">
                {#if lineState(i, step) === "working"}
                  <DitherSpinner size={14} color="orange" />
                {:else}
                  <span class="tick"></span>
                {/if}
              </span>
              {line}
            </li>
          {/each}
        </ol>
      </div>

      <!-- The screen the agent lays out, the hero of the shot. -->
      <div class="screen">
        <!-- The render's result, a chip on the screen's corner: it comes
             with the line that renders, at work, then ready. -->
        <div class={["render", lineState(RENDER, step)]} aria-hidden="true">
          <span class="mark">
            {#if lineState(RENDER, step) !== "done"}
              <DitherSpinner size={14} color="orange" />
            {:else}
              <span class="tick"></span>
            {/if}
          </span>
          <span class="render-words">
            <span data-on={lineState(RENDER, step) !== "done" ? "" : undefined}>Rendering MP4</span>
            <span data-on={lineState(RENDER, step) === "done" ? "" : undefined}>MP4 ready</span>
          </span>
        </div>
        <div class="screen-title">Deploys</div>
        <div class="screen-row">
          <div class={["part", step >= PARTS.count && "on"]}>
            <span class="slot"></span>
            <div class="count">
              <span class="count-n">{DEPLOYS}</span>
              <span class="count-d">deploys this week</span>
            </div>
          </div>
          <div class={["part", step >= PARTS.meter && "on"]}>
            <span class="slot"></span>
            <div class="meter">
              <span class="count-d">Build minutes, 64% used</span>
              <!-- The line above says the figure; the bar is its picture. -->
              <div aria-hidden="true"><DitherProgress value={64} color="blue" /></div>
            </div>
          </div>
        </div>
        <div class={["part", "part-switch", step >= PARTS.toggle && "on"]}>
          <span class="slot"></span>
          <div class="switch">
            <DitherSwitch bind:value={auto} label="Auto deploy" />
            <span aria-hidden="true">Auto deploy</span>
          </div>
        </div>
        <div class={["part", "part-chart", step >= PARTS.chart && "on"]} aria-hidden="true">
          <span class="slot"></span>
          <div class="chart"><Sparkline data={[...DAYS]} color="blue" variant="dotted" sparkles={false} /></div>
        </div>
      </div>
    </div>

    <figcaption class="sr-only">
      The ask: {ASK} Your agent {TOLD.slice(0, -1).join(", ")} and {TOLD[TOLD.length - 1]}.
    </figcaption>
  </figure>
  {#if pinned}
    <div class="markers" aria-hidden="true">
      {#each { length: STEPS }, i (i)}
        <span bind:this={markers[i]}></span>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* The story's run: a notch of scroll per step, then the pinned stage's own
     height, so the last step holds a beat before the stage lets go. */
  .story {
    --notch: 32svh;
    /* Most of the screen while it plays: the stage is the frame, never a
       band with the page's ground under it. */
    --pin: min(calc(100svh - 112px), 40rem);
    position: relative;
  }

  .story.pinned {
    height: calc(var(--steps) * var(--notch) + var(--pin));
  }

  .pin {
    margin: 0;
  }

  .pinned .pin {
    position: sticky;
    top: 76px;
    height: var(--pin);
  }

  .markers {
    position: absolute;
    inset: 0 auto auto 0;
    display: flex;
    flex-direction: column;
    width: 1px;
    height: calc(var(--steps) * var(--notch));
    pointer-events: none;
  }

  .markers > span {
    flex: 1;
  }

  /* The stage: one raised ground, the shot's frame, one gutter. One row,
     the stage's height: the screen overflows it (the bleed), never
     stretches it. */
  .stage {
    --gutter: 32px;
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    grid-template-rows: minmax(0, 1fr);
    gap: var(--gutter);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: 24px;
    background: var(--surface);
  }

  .session {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 22px;
    min-height: 0;
    padding: var(--gutter) 0 var(--gutter) var(--gutter);
  }

  .ask {
    margin: 0;
    padding: 14px 18px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.6;
    color: var(--ink);
    background: var(--background);
    text-wrap: pretty;
  }

  .does {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0 0 0 4px;
    list-style: none;
  }

  .does li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12.5px;
    color: var(--ink-3);
    transition:
      opacity 240ms var(--ease-settle),
      translate 350ms var(--ease-settle),
      color 240ms var(--ease-settle);
  }

  .does li.working {
    color: var(--ink);
  }

  .does li.ahead {
    visibility: hidden;
    opacity: 0;
    translate: 0 6px;
  }

  /* One cell for the spinner and the done mark, so a line never shifts. */
  .mark {
    display: grid;
    flex: none;
    place-items: center;
    width: 16px;
    height: 16px;
  }

  /* A done line's mark: one ember cell, the kit's own unit. */
  .tick {
    width: 6px;
    height: 6px;
    background: var(--signal);
  }

  .screen {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 22px;
    align-self: start;
    width: calc(100% + 15%);
    height: calc(100% - var(--gutter) + 80px);
    margin-top: var(--gutter);
    padding: 28px;
    border-radius: 16px;
    background: var(--background);
  }

  .screen-title {
    font-size: 14px;
    color: var(--ink);
  }

  .screen-row {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
    gap: 32px;
    max-width: 34rem;
  }

  /* A part and its slot share one cell: the part arrives as the slot leaves. */
  .part {
    display: grid;
    align-items: center;
  }

  .part > * {
    grid-area: 1 / 1;
    transition:
      opacity 240ms var(--ease-settle),
      translate 350ms var(--ease-settle);
  }

  .slot {
    align-self: stretch;
    border-radius: 8px;
    background: var(--surface);
  }

  .part > :not(.slot) {
    opacity: 0;
    translate: 0 6px;
  }

  .part.on > .slot {
    opacity: 0;
  }

  .part.on > :not(.slot) {
    opacity: 1;
    translate: 0;
  }

  .count {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .count-n {
    font-size: 2.75rem;
    font-weight: 500;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .count-d {
    font-size: 12px;
    color: var(--ink-3);
  }

  .meter {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .part-switch {
    align-self: flex-start;
  }

  .switch {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--ink);
  }

  /* The screen's switch is a real control: it keeps its tab stop whatever
     the scroll, out of the pointer's reach until it shows, and a keyboard
     that reaches it lands the whole screen at once. */
  .part-switch:not(.on) .switch {
    pointer-events: none;
  }

  .screen:focus-within .part > .slot {
    opacity: 0;
  }

  .screen:focus-within .part > :not(.slot) {
    opacity: 1;
    translate: 0;
    pointer-events: auto;
  }

  /* The chart, the filler the crop cuts: quiet, right under the switch,
     running well past the stage's foot. */
  .part-chart {
    flex: 1;
    min-height: 160px;
    margin-top: 4px;
    align-items: stretch;
  }

  .chart,
  .chart > :global(*) {
    width: 100%;
    height: 100%;
  }

  /* The render chip, centred on the screen's top-left corner, half over
     the stage: a step above both grounds, so it reads on either. Its words
     share one cell and crossfade. */
  .render {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px 8px 10px;
    border-radius: 999px;
    font-size: 12px;
    white-space: nowrap;
    color: var(--ink);
    background: color-mix(in oklab, var(--foreground) 14%, var(--background));
    translate: -50% -50%;
    transition:
      opacity 240ms var(--ease-settle),
      translate 350ms var(--ease-settle);
  }

  .render.ahead {
    visibility: hidden;
    opacity: 0;
    translate: -50% calc(-50% + 6px);
  }

  .render-words {
    display: grid;
  }

  .render-words > span {
    grid-area: 1 / 1;
    opacity: 0;
    transition: opacity 150ms var(--ease-settle);
  }

  .render-words > span[data-on] {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .part > *,
    .does li,
    .render,
    .render-words > span {
      transition: none;
    }
  }

  @media (max-width: 899px) {
    .stage {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto;
      gap: 24px;
      --gutter: 20px;
    }
    .session {
      padding: var(--gutter) var(--gutter) 0;
    }
    .screen {
      width: calc(100% + 12%);
      height: auto;
      min-height: 300px;
      margin: 0 0 -48px var(--gutter);
      padding: 22px;
    }
    .screen-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
    }
    /* The stage's left edge is a gutter away: the chip rides the screen's
       top edge from the corner in, whole. */
    .render {
      left: 18px;
      translate: 0 -50%;
    }
  }
</style>
