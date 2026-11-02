<script lang="ts">
  // "Every component, live.": the title beside a line and the docs link, then
  // a bento of live kit components, row by row (`BENTO`), each a card of its
  // art over its name. The name leads into the docs section; the art is the
  // component itself, hands on, in the kit's blue with the ember for a second
  // voice. Of the surfaces that move by themselves one plays at a time;
  // everything that moves has its pause.
  import { onDestroy, onMount } from "svelte"
  import { SvelteSet } from "svelte/reactivity"
  import {
    Area,
    AreaChart,
    DecryptedText,
    DitherButton,
    DitherGradient,
    DitherRating,
    DitherScreen,
    Ferrofluid,
    NumberFlow,
    SCREEN_KINDS,
    Silk,
    Sparkline,
    XAxis,
    cssColor,
    type ButtonVariant,
    type DitherColor,
    type ScreenKind,
  } from "@dither-kit-svelte"
  import { COMPONENT_COUNT, docsHref } from "./facts"
  import PauseChip from "./PauseChip.svelte"
  import { spotlight } from "./spotlight"
  import { DAYS, FRAMES, WEEK_CHANGE, ago, shown } from "./stat"

  /** The bento, row by row: a tall lead card (8) beside two stacked (4); a
   * full row; a wide card (8) beside a third; two halves. Each leads into
   * its docs section (`docsHref` throws on one the docs do not render). */
  const BENTO = [
    { id: "ferrofluid", label: "Ferrofluid" },
    { id: "rating", label: "Rating" },
    { id: "sparkline", label: "Sparkline" },
    { id: "gradient", label: "Gradient" },
    { id: "area", label: "Area chart" },
    { id: "button", label: "Button" },
    { id: "silk", label: "Silk" },
    { id: "decrypted-text", label: "Decrypted text" },
  ].map((t) => ({ ...t, href: docsHref(t.id) }))
  // Cards whose art runs to the card's edges.
  const FLUSH = new Set(["ferrofluid", "gradient", "silk"])

  // One moving layer at a time (`spotlight.ts`): of the surfaces that move by
  // themselves only the spotlit one plays, the rest hold a still frame. A
  // chip says whether its surface plays: a pause is the reader's and outlasts
  // the spotlight, and play on a held surface makes it the reader's choice.
  // A mouse or pen hovering a card, or keyboard focus inside it, points at
  // it; a touch chooses through the chip, since a tap (which also focuses)
  // would point at the card and then toggle what it just started.
  const MOVING = ["ferrofluid", "silk"] as const
  type Moving = (typeof MOVING)[number]
  const isMoving = (id: string): id is Moving => (MOVING as readonly string[]).includes(id)
  const stilled = new SvelteSet<Moving>()
  const visible = new SvelteSet<Moving>()
  const centred = new SvelteSet<Moving>()
  let pointed = $state<Moving | null>(null)
  let chosen = $state<Moving | null>(null)
  let last = $state<Moving | null>(null)
  const lit = $derived(spotlight(MOVING, { pointed, chosen, visible, centred, last }))
  // The last that played: the fallback when nothing else points anywhere.
  const remember = () => (last = lit)
  const playing = (id: Moving) => lit === id && !stilled.has(id)
  const setPlaying = (id: Moving, on: boolean) => {
    if (!on) stilled.add(id)
    else {
      stilled.delete(id)
      chosen = id
    }
    remember()
  }
  const aim = (id: string) => {
    if (!isMoving(id)) return
    pointed = id
    chosen = id
    remember()
  }
  const hover = (e: PointerEvent, id: string) => {
    if (e.pointerType !== "touch") aim(id)
  }
  const focus = (e: FocusEvent, id: string) => {
    if (e.target instanceof Element && e.target.matches(":focus-visible")) aim(id)
  }
  const leave = (id: string) => {
    if (pointed === id) pointed = null
    remember()
  }

  let bento = $state<HTMLElement | null>(null)
  const observers: IntersectionObserver[] = []
  onMount(() => {
    if (typeof IntersectionObserver === "undefined" || !bento) {
      for (const id of MOVING) {
        visible.add(id)
        centred.add(id)
      }
      return remember()
    }
    const cards = [...bento.querySelectorAll<HTMLElement>("[data-moving]")]
    const track = (init: IntersectionObserverInit, into: SvelteSet<Moving>) => {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.moving as Moving
          if (e.isIntersecting) into.add(id)
          else into.delete(id)
        }
        remember()
      }, init)
      for (const c of cards) io.observe(c)
      observers.push(io)
    }
    // Each moving card is tracked on screen and across the middle tenth of
    // the viewport.
    track({}, visible)
    track({ rootMargin: "-45% 0px -45% 0px" }, centred)
  })
  onDestroy(() => observers.forEach((io) => io.disconnect()))

  // Ferrofluid: the kit's blue, the ember, or the page's grey.
  const FLUIDS = {
    blue: ["#2f6fd0", "#7ba3ee", "#c9dbff"],
    ember: ["#a84d17", "#f08a3c", "#ffd9b0"],
    grey: ["#25292d", "#5d6268", "#a6abb1"],
  } as const
  type Fluid = keyof typeof FLUIDS
  const FLUID_NAMES = Object.keys(FLUIDS) as Fluid[]
  let fluid = $state<Fluid>("blue")

  // Rating.
  let stars = $state(4)

  // Stat card: scrub the sparkline and the headline rolls to the day under
  // the pointer (`stat.ts`).
  let day = $state<number | null>(null)

  // Print screens: one tone ramp, raw on the left and printed on the right,
  // the split dragged (or stepped by keyboard) and the screen switched in
  // place. The raw ramp runs in linear light, so the printed cells average to
  // it: from a step back the two halves are one tone.
  let screen = $state<ScreenKind>("bayer")
  let split = $state(42)

  // Area chart: one seed sets every fill; roll it and every fill changes.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const REVENUE = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
  const EXPENSES = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
  const AREA_ROWS = MONTHS.map((month, i) => ({ month, revenue: REVENUE[i], expenses: EXPENSES[i] }))
  const AREA_CONFIG = {
    revenue: { label: "Revenue", color: "blue" as DitherColor },
    expenses: { label: "Expenses", color: "grey" as DitherColor },
  }
  let fills = $state(1984)
  // Four digits, as the first: every roll keeps its columns and rolls them.
  const roll = () => (fills = 1000 + Math.floor(Math.random() * 9000))

  // Button: four fills, five hues.
  const FILLS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
  const HUES: DitherColor[] = ["blue", "orange", "green", "purple", "pink"]
  let variant = $state<ButtonVariant>("gradient")
  let hue = $state<DitherColor>("blue")

  // Silk, in the kit's blue.
  const SILK = ["#2f6fd0", "#c9dbff", "#2f6fd0"]
</script>

<section id="examples" aria-labelledby="examples-h" class="examples">
  <div class="sec-head">
    <h2 id="examples-h" class="section-title chrome-type">Every component, live.</h2>
    <div class="sec-side">
      <p class="sec-lede">
        {COMPONENT_COUNT} components on one engine. Every card is the real thing, so poke it, then open its docs for the
        props and the code.
      </p>
      <a href={docsHref()} class="more-link">See every section in the docs</a>
    </div>
  </div>

  <ul bind:this={bento} class="bento" aria-label="Examples from the docs">
    {#each BENTO as t (t.id)}
      <li
        class={["card", `t-${t.id}`]}
        data-moving={isMoving(t.id) ? t.id : undefined}
        onpointerenter={(e) => hover(e, t.id)}
        onpointerleave={() => leave(t.id)}
        onfocusin={(e) => focus(e, t.id)}
        onfocusout={() => leave(t.id)}
      >
        <div class={["card-art", FLUSH.has(t.id) && "flush"]}>
          {#if t.id === "ferrofluid"}
            <div>
              <Ferrofluid colors={[...FLUIDS[fluid]]} paused={!playing("ferrofluid")} class="h-full w-full" />
            </div>
            <PauseChip
              bind:playing={() => playing("ferrofluid"), (on) => setPlaying("ferrofluid", on)}
              label="Pause the fluid"
              class="chip"
            />
            <div class="art-tools">
              <div class="seg" role="group" aria-label="Fluid palette">
                {#each FLUID_NAMES as f (f)}
                  <button type="button" aria-pressed={fluid === f} onclick={() => (fluid = f)}>{f}</button>
                {/each}
              </div>
            </div>
          {:else if t.id === "rating"}
            <div class="stack">
              <DitherRating bind:value={stars} size={30} label="Rate the kit" />
              <span class="readout"><NumberFlow value={stars} duration={320} /> of 5</span>
            </div>
          {:else if t.id === "sparkline"}
            <div class="panel stat">
              <span class="panel-d">Frames exported</span>
              <NumberFlow value={shown(day)} duration={240} class="stat-v" />
              <span class="panel-d stat-sub">
                <span data-on={day === null ? "" : undefined} aria-hidden={day !== null}><b>+{WEEK_CHANGE}%</b> on the week before</span>
                <span data-on={day === null ? undefined : ""} aria-hidden={day === null}>{ago(day ?? DAYS - 1)}</span>
              </span>
              <div class="stat-spark">
                <Sparkline
                  data={FRAMES}
                  color="blue"
                  interactive
                  label="Frames exported"
                  hoverLift={false}
                  sparkles={false}
                  onHoverChange={(i) => (day = i)}
                />
              </div>
            </div>
          {:else if t.id === "gradient"}
            <div class="split" style:--split="{split}%">
              <DitherScreen {screen}>
                <DitherGradient from="#e4e1d8" to="#101214" direction="down" cell={5} />
              </DitherScreen>
              <div class="split-layer split-raw" aria-hidden="true"></div>
              <input
                bind:value={split}
                type="range"
                min="0"
                max="100"
                class="split-range"
                aria-label="The ramp raw on the left, printed on the right: move the split"
              />
              <span class="split-handle" aria-hidden="true"><span class="split-grip"></span></span>
              <div class="art-tools">
                <div class="seg" role="group" aria-label="Screen">
                  {#each SCREEN_KINDS as k (k)}
                    <button type="button" aria-pressed={screen === k} onclick={() => (screen = k)}>{k}</button>
                  {/each}
                </div>
              </div>
            </div>
          {:else if t.id === "area"}
            <div class="panel">
              {#key fills}
                <div class="area-chart">
                  <AreaChart data={AREA_ROWS} config={AREA_CONFIG} seed={fills} sparkles={false}>
                    <XAxis dataKey="month" maxTicks={6} />
                    <Area dataKey="expenses" variant={fills + 1} />
                    <Area dataKey="revenue" variant={fills} />
                  </AreaChart>
                </div>
              {/key}
              <div class="row">
                <button type="button" class="key" onclick={roll}>Roll a seed</button>
                <span class="readout">seed <NumberFlow value={fills} duration={320} /></span>
              </div>
            </div>
          {:else if t.id === "button"}
            <div class="stack">
              <DitherButton color={hue} {variant} class="min-h-12 px-8 text-sm">Publish</DitherButton>
              <div class="seg" role="group" aria-label="Fill">
                {#each FILLS as v (v)}
                  <button type="button" aria-pressed={variant === v} onclick={() => (variant = v)}>{v}</button>
                {/each}
              </div>
              <div class="swatches" role="group" aria-label="Hue">
                {#each HUES as c (c)}
                  <button
                    type="button"
                    class="swatch"
                    aria-label={c}
                    aria-pressed={hue === c}
                    style:background-color={cssColor(c)}
                    onclick={() => (hue = c)}
                  ></button>
                {/each}
              </div>
            </div>
          {:else if t.id === "silk"}
            <div>
              <Silk colors={SILK} frameRate={12} paused={!playing("silk")} class="h-full w-full" />
            </div>
            <PauseChip
              bind:playing={() => playing("silk"), (on) => setPlaying("silk", on)}
              label="Pause the silk"
              class="chip"
            />
          {:else if t.id === "decrypted-text"}
            <p class="cipher">
              <DecryptedText text="Decoded as" />
              <DecryptedText text="it comes into view." />
            </p>
          {/if}
        </div>
        <p class="card-foot">
          <a href={t.href} class="card-name">{t.label}</a>
        </p>
      </li>
    {/each}
  </ul>
</section>

<style>
  .examples {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* The bento: twelve columns, row by row. Under 1024px a rail (below), so
     the whole bento takes one screen. */
  .bento {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* A card: the raised ground, no border. Its art hands its keys and picked
     segments the page's ground, so they stay shapes on it. */
  .card {
    --card: var(--surface);
    grid-column: span 4;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    border-radius: 20px;
    background: var(--card);
  }

  .t-ferrofluid {
    grid-column: span 8;
    grid-row: span 2;
  }

  .t-gradient {
    grid-column: 1 / -1;
  }

  .t-area {
    grid-column: span 8;
  }

  .t-silk,
  .t-decrypted-text {
    grid-column: span 6;
  }

  .card-art {
    --surface: var(--background);
    position: relative;
    display: grid;
    place-items: center;
    height: 260px;
    padding: 24px;
    min-width: 0;
  }

  .t-ferrofluid .card-art {
    flex: 1;
    height: auto;
    min-height: 420px;
  }

  .t-rating .card-art,
  .t-sparkline .card-art {
    height: 220px;
    padding: 18px 20px;
  }

  .t-gradient .card-art,
  .t-silk .card-art,
  .t-decrypted-text .card-art,
  .t-area .card-art,
  .t-button .card-art {
    height: 300px;
  }

  .card-art.flush {
    padding: 0;
  }

  .card-art.flush > :first-child {
    position: absolute;
    inset: 0;
  }

  /* The footer: the name, the docs link. */
  .card-foot {
    display: flex;
    align-items: center;
    min-height: 48px;
    margin: 0;
    padding: 0 20px 4px;
  }

  .card-name {
    margin-block: -4px;
    padding-block: 4px;
    font-size: 13px;
    color: var(--ink);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
    text-decoration-color: transparent;
    transition: text-decoration-color 200ms var(--ease-settle);
  }

  .card-name:hover,
  .card:hover .card-name {
    text-decoration-color: currentColor;
  }

  /* Over the flush art: its tools along its foot, a pause chip at the top
     right. */
  .art-tools {
    position: absolute;
    left: 16px;
    bottom: 16px;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .art-tools .seg {
    padding: 2px;
    border-radius: 10px;
    background: var(--card);
  }

  /* The five screens keep inside the card on the narrowest phones. */
  @media (max-width: 359px) {
    .art-tools .seg > button {
      padding-inline: 8px;
    }
  }

  .card-art :global(.chip) {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
  }

  /* Print screens: the printed ramp under the raw one, the raw clipped at the
     split; a full-size range takes the drag (vertical swipes still scroll)
     and the keys, its handle a bone disc on a bone line. */
  .split-layer {
    position: absolute;
    inset: 0;
  }

  .split-raw {
    background: linear-gradient(in srgb-linear to bottom, #e4e1d8, #101214);
    clip-path: inset(0 calc(100% - var(--split)) 0 0);
  }

  .split-range {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: ew-resize;
    touch-action: pan-y;
  }

  .split-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--split);
    z-index: 1;
    width: 1px;
    background: var(--ink);
    pointer-events: none;
  }

  /* The grip: a bone disc holding two bars in the ground. */
  .split-grip {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background:
      linear-gradient(var(--background), var(--background)) calc(50% - 3px) 50% / 2px 12px no-repeat,
      linear-gradient(var(--background), var(--background)) calc(50% + 3px) 50% / 2px 12px no-repeat,
      var(--ink);
    translate: -50% -50%;
  }

  /* The ring sits on a band of the ground, so it shows on the light end of
     the ramp as on the dark. */
  .split-range:focus-visible + .split-handle .split-grip {
    outline: 2px solid var(--ring);
    outline-offset: 3px;
    box-shadow: 0 0 0 3px var(--background);
  }

  .stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    width: 100%;
    height: 100%;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .area-chart {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .swatches {
    display: flex;
    gap: 8px;
  }

  .swatch {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
  }

  .swatch[aria-pressed="true"] {
    box-shadow:
      0 0 0 2px var(--card),
      0 0 0 3px var(--ink);
  }

  .readout {
    font-size: 11px;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }

  /* A small app panel: a label line, a big figure, then its chart. */
  .panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    height: 100%;
  }

  .panel-d {
    font-size: 11.5px;
    color: var(--ink-3);
  }

  .panel-d b {
    font-weight: 500;
    color: var(--ink);
  }

  /* The stat card: its figures over a sparkline that takes the rest of the
     art, scrubbed by the pointer; the line under the figure holds both its
     readings in one cell and crossfades between them. */
  .stat-sub {
    display: grid;
  }

  .stat-sub > span {
    grid-area: 1 / 1;
    opacity: 0;
    transition: opacity 200ms var(--ease-settle);
  }

  .stat-sub > span[data-on] {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .stat-sub > span {
      transition: none;
    }
  }

  .stat :global(.stat-v) {
    font-size: 1.9rem;
    font-weight: 500;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .stat-spark {
    position: relative;
    flex: 1;
    min-height: 72px;
    margin-top: 10px;
    cursor: crosshair;
  }

  .cipher {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    font-family: var(--display-face);
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    line-height: 1.15;
    text-align: center;
    color: var(--ink);
  }

  /* Under 1024px a rail the reader swipes: a card and the next one's edge
     in view, the rail running out to the page's edges past its gutter
     (24px, 16px on a phone). */
  @media (max-width: 1023px) {
    .bento {
      --gutter: 24px;
      display: flex;
      gap: 12px;
      margin-inline: calc(var(--gutter) * -1);
      padding: 0 var(--gutter) 4px;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: var(--gutter);
      scrollbar-width: none;
    }
    .bento::-webkit-scrollbar {
      display: none;
    }
    .card {
      flex: 0 0 min(86%, 440px);
      scroll-snap-align: start;
    }
    /* Every card the rail's height: the art takes what the name leaves. */
    .bento .card .card-art {
      flex: 1;
      height: auto;
      min-height: 340px;
    }
  }

  @media (max-width: 639px) {
    .bento {
      --gutter: 16px;
    }
  }
</style>
