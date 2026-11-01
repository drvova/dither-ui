<script lang="ts">
  // The ask as a story: a stage pinned while the page scrolls past it plays
  // one agent session (`story.ts`), a step per notch. The ask and the
  // screen's frame are there from the first step; then what the agent does,
  // a line at a time, while the screen it lays out fills in on the left part
  // by part. The step is the marker crossing the viewport's middle (one
  // IntersectionObserver, no scroll listener). Under 900px, or without an
  // observer, the stage is not pinned and shows the whole session at once.
  // Screen readers get the whole session as a caption; the stage that plays
  // it is decoration, but for the screen's switch, a real control.
  import { onDestroy, onMount, tick } from "svelte"
  import { DitherProgress, DitherSwitch } from "@dither-kit-svelte"
  import { ASK, DOES, PARTS, STEPS } from "./story"

  const LAST = STEPS - 1
  const TOLD = DOES.map((d) => d.line[0].toLowerCase() + d.line.slice(1))

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
      <div class="canvas">
        <div class="frame">
          <h3 class="frame-h">Deploys</h3>
          <div class={["part", step < PARTS.count && "off"]}>
            <div class="frame-row">
              <span class="frame-n">16</span>
              <span class="frame-d">deploys this week</span>
            </div>
          </div>
          <div class={["part", "frame-meter", step < PARTS.meter && "off"]}>
            <span class="frame-d">Build minutes, 64% used</span>
            <!-- The line above says the figure; the bar is its picture. -->
            <div aria-hidden="true"><DitherProgress value={64} color="blue" /></div>
          </div>
          <div class={["part", "frame-switch", step < PARTS.toggle && "off"]}>
            <DitherSwitch bind:value={auto} label="Auto deploy" />
            <span aria-hidden="true">Auto deploy</span>
          </div>
        </div>
      </div>

      <!-- The session as it plays: decoration over the caption. -->
      <div class="session" aria-hidden="true">
        <p class="ask">{ASK}</p>
        <ol class="does">
          {#each DOES as d (d.line)}
            <li class={[step < d.step && "off"]}><span class="tick"></span>{d.line}</li>
          {/each}
        </ol>
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
    --pin: min(calc(100svh - 96px), 23rem);
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

  /* The stage: one raised ground, the screen's canvas beside the session,
     halves, so the screen fills its side. */
  .stage {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: 24px;
    background: var(--surface);
  }

  .canvas {
    position: relative;
    display: grid;
    place-items: center;
    padding: 32px 24px;
  }

  /* The screen the agent lays out: the page's ground on the stage. */
  .frame {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    width: min(100%, 32rem);
    min-height: 15rem;
    padding: 28px;
    border-radius: 16px;
    background: var(--background);
  }

  .frame-h {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
  }

  .part {
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition:
      opacity 240ms var(--ease-settle),
      translate 240ms var(--ease-settle);
  }

  /* What has not happened yet keeps its place, unseen and out of reach. */
  .off {
    visibility: hidden;
    opacity: 0;
    translate: 0 6px;
  }

  /* Except the screen's switch, a real control: it keeps its place in the tab
     order whatever the scroll, out of the pointer's reach until it shows, and
     a keyboard that reaches it lands the whole screen at once. */
  .frame-switch.off {
    visibility: visible;
    pointer-events: none;
  }

  .frame:focus-within,
  .frame:focus-within .part.off {
    visibility: visible;
    opacity: 1;
    translate: 0;
    pointer-events: auto;
  }

  .frame-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .frame-n {
    font-size: 1.6rem;
    font-weight: 500;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .frame-d {
    font-size: 12px;
    color: var(--ink-3);
  }

  .frame-meter {
    gap: 7px;
  }

  .frame-switch {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--ink);
  }

  /* The session: the ask, then what the agent does, a line at a time. */
  .session {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    min-height: 0;
    padding: 32px 40px 32px 16px;
  }

  .ask {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: var(--ink);
    text-wrap: pretty;
  }

  .does {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
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
      translate 240ms var(--ease-settle);
  }

  /* A done line's mark: one ember cell, the kit's own unit. */
  .tick {
    flex: none;
    width: 6px;
    height: 6px;
    background: var(--signal);
  }

  @media (prefers-reduced-motion: reduce) {
    .part,
    .does li {
      transition: none;
    }
  }

  @media (max-width: 899px) {
    .stage {
      grid-template-columns: minmax(0, 1fr);
    }
    .canvas {
      padding: 24px 16px 8px;
    }
    .session {
      padding: 16px 24px 28px;
    }
  }
</style>
