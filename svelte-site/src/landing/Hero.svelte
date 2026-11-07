<script lang="ts">
  // The hero: the first screen tall, the statement beside a print the kit
  // makes (a live Poster: the palette as tone, the kit's diamond knocked out
  // of it, its screen sliding inside the mark), on the obsidian like a print
  // on black stock. The film is a key away.
  import { Poster } from "@dither-kit-svelte"
  import BrandGather from "./BrandGather.svelte"
  import { STAGINGS } from "./brand"
  import { COMPONENT_COUNT, MATRIX, WORKS, docsHref } from "./facts"
  import { STUDIO } from "./links"
  import { INKS } from "./plate"
  import ToolMark from "./ToolMark.svelte"
  import TrailerDialog from "./TrailerDialog.svelte"
  import { createDrive } from "./drive"
  import { onDestroy } from "svelte"

  let film = $state(false)

  // The statement signs off with the brand (`STAGINGS.hero`), gathering out
  // of the open field of the page's column under it as the page opens, and
  // again under a resting mouse. One moving layer at a time: the print holds
  // its frame until the brand is home.
  let gathered = $state(false)

  // The print moves on cue (no perpetual loops): its screen slides for
  // HERO_RUN once the brand is home, then only while a pointer moves over
  // it. Under five seconds by itself, so no pause key.
  const HERO_RUN = 4000
  let driven = $state(false)
  const timer = createDrive((m) => (driven = m))
  onDestroy(() => timer.dispose())
</script>

<section aria-labelledby="hero-h" class="hero">
  <div class="hero-in">
    <div class="statement">
      <h1 id="hero-h" class="hero-h chrome-type">A dithered UI toolkit for Svelte.</h1>
      <p class="hero-lede">
        {COMPONENT_COUNT} components, from charts and controls to backgrounds and text effects, each printed cell by cell
        through one seeded {MATRIX} matrix. Copy the folder into a Svelte 5 app and change what you need.
      </p>
      <div class="hero-keys">
        <a href={STUDIO} class="nav-a key-chrome primary">Open the studio</a>
        <a href={docsHref()} class="key">Read the docs</a>
        <button type="button" class="key" onclick={() => (film = true)}>
          <span class="play" aria-hidden="true"></span>Watch the film
        </button>
      </div>
      <div class="works">
        <span id="works-l">Works with</span>
        <ul aria-labelledby="works-l">
          {#each WORKS as t (t.id)}
            <li><ToolMark id={t.id} size={13} />{t.name}</li>
          {/each}
        </ul>
      </div>
      <BrandGather
        class="hero-brand"
        scene={STAGINGS.hero}
        replay
        onmoving={() => (gathered = false)}
        onsettled={() => {
          gathered = true
          timer.run(HERO_RUN)
        }}
      />
    </div>
    <div class="print-col">
      <div class="print" role="presentation" onpointermove={() => gathered && timer.run()}>
        <Poster seed={5} inks={INKS} cell={4} speed={1.5} paused={!driven || !gathered} />
      </div>
    </div>
  </div>
  <TrailerDialog bind:open={film} />
</section>

<style>
  /* The hero: the first screen under the header; on the page width, the
     statement (left) beside the print (right). Under 900px the statement
     comes first and the print takes the width under it, landscape. */
  .hero {
    position: relative;
    isolation: isolate;
    display: grid;
    align-items: center;
    min-height: clamp(34rem, calc(100svh - 64px), 52rem);
    overflow: hidden;
  }

  /* Positioned: the brand's field is the page's column. */
  .hero-in {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    align-items: center;
    gap: 0 48px;
    width: 100%;
    max-width: var(--page);
    margin-inline: auto;
    padding: 0 1.5rem;
  }

  .statement {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 36px 0;
  }

  /* The statement in the display face at display size. */
  .hero-h {
    margin: 0;
    font-family: var(--display-face);
    font-size: clamp(2rem, 3.9vw, 3.5rem);
    font-weight: 400;
    line-height: 1.08;
    text-wrap: balance;
  }

  .hero-lede {
    margin: 0;
    max-width: 30rem;
    font-size: 14px;
    line-height: 1.65;
    color: var(--ink-3);
    text-wrap: pretty;
  }

  .hero-keys {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .primary {
    padding-inline: 14px;
  }

  /* Play: a triangle in the key's ink. */
  .play {
    width: 8px;
    height: 9px;
    background: currentColor;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }

  /* What it works with: a quiet line of marks and names. */
  .works {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--ink-3);
  }

  .works ul {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .works li {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  /* The brand at the statement's foot; its cells travel the page's column
     (`.hero-in`), the nearest positioned ancestor. */
  .statement :global(.hero-brand) {
    position: relative;
    margin-top: 20px;
  }

  /* The print: a portrait sheet set on the obsidian inside its column, square
     cornered and flat. Its pause sits on its top right corner. */
  .print-col {
    display: grid;
    justify-items: end;
    min-width: 0;
    padding: 40px 0;
  }

  .print {
    position: relative;
    width: min(100%, 30rem);
    aspect-ratio: 4 / 5;
  }

  @media (max-width: 1199px) {
    .hero-in {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }

  @media (max-width: 899px) {
    .hero-in {
      grid-template-columns: minmax(0, 1fr);
      padding: 0;
    }
    .statement {
      padding: 28px 1.5rem 8px;
    }
    .print-col {
      justify-items: stretch;
      padding: 16px 1.5rem 40px;
    }
    .print {
      width: 100%;
      aspect-ratio: 5 / 4;
    }
  }

  @media (max-width: 639px) {
    .statement,
    .print-col {
      padding-inline: 16px;
    }
  }
</style>
