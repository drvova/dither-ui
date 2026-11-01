<script lang="ts">
  // Plays well with others: what the kit meets on the reader's side, lists
  // at reading size under the section's head. Their styling (each tool under
  // its own mark) and their agent (the bridge's harnesses, and any command
  // besides). The Vue page's third list, the model formats, waits on the
  // Svelte kit's 3D surfaces.
  import { HARNESSES, WORKS, docsHref } from "./facts"
  import ToolMark from "./ToolMark.svelte"
</script>

<section id="works" aria-labelledby="works-h" class="sec">
  <div class="sec-head">
    <h2 id="works-h" class="section-title chrome-type">Plays well with others.</h2>
    <div class="sec-side">
      <p class="sec-lede">
        Bring the stack you already have. The kit themes from plain CSS variables under your Tailwind, and the bridge
        wakes the agent you are already signed in to.
      </p>
      <a href={docsHref("styling")} class="more-link">Read the styling guide</a>
    </div>
  </div>
  <div class="works">
    <div>
      <h3 id="works-styling" class="works-h">Your styling</h3>
      <ul aria-labelledby="works-styling">
        {#each WORKS as t (t.id)}
          <li><ToolMark id={t.id} size={18} />{t.name}</li>
        {/each}
      </ul>
    </div>
    <div>
      <h3 id="works-agent" class="works-h">Your agent</h3>
      <ul aria-labelledby="works-agent">
        {#each HARNESSES as h (h.id)}
          <li><ToolMark id={h.id} size={18} />{h.name}</li>
        {/each}
      </ul>
      <p class="works-more">or any command you hand the bridge</p>
    </div>
  </div>
</section>

<style>
  .sec {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  /* Lists at reading size in one raised panel: each a quiet heading over
     its rows, a mark and a name, generous like a menu. A column each down
     to a phone, then one (its rows two abreast). */
  .works {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    gap: 32px 48px;
    padding: 28px 32px 32px;
    border-radius: 20px;
    background: var(--surface);
  }

  .works-h {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
  }

  .works ul {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 15px;
    color: var(--ink);
  }

  /* The agents run two abreast in their wider column. */
  .works > div:last-child ul {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 24px;
  }

  .works li {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .works-more {
    margin: 16px 0 0;
    font-size: 13px;
    color: var(--ink-3);
  }

  @media (max-width: 899px) {
    .works {
      column-gap: 28px;
      padding-inline: 24px;
    }
  }

  @media (max-width: 639px) {
    .works {
      grid-template-columns: minmax(0, 1fr);
      padding: 24px 20px;
    }
    /* Each list two abreast, so the panel stays a screen or so tall. */
    .works ul,
    .works > div:last-child ul {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px 12px;
      font-size: 14px;
    }
  }
</style>
