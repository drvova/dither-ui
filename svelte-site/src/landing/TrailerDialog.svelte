<script lang="ts">
  // The film: a minute of the kit by hand, then one screen built in the
  // Studio, over its score. It is the main site's (dither-ui.com/trailer/),
  // and nothing of it loads until the dialog opens (the <video> exists only
  // while it is open); opening it was the visitor's ask, so it plays at
  // once, except under reduced motion, where it waits on its poster for
  // play. H.264 first, VP9 for a browser built without it. The kit's dialog
  // traps focus, closes on Escape and the backdrop, and hands focus back.
  import { DitherDialog } from "@dither-kit-svelte"

  let { open = $bindable() }: { open: boolean } = $props()

  const FILM = "https://dither-ui.com/trailer"
  // Started inside the visitor's tap: iOS WebKit lets a film with sound
  // start only from a gesture. Refused anyway, it waits on its poster.
  function start(el: HTMLVideoElement) {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) el.play().catch(() => {})
  }
</script>

<DitherDialog
  {open}
  title="The dither-ui film"
  description="A minute of the kit by hand: buttons, sliders, a hold, a slide, charts, a 3D model and a fluid. Then one screen built in the Studio by hand and by an agent, its code and its reel. Music and interface sounds, no speech."
  class="max-w-5xl"
  onclose={() => (open = false)}
>
  {#if open}
    <!-- svelte-ignore a11y_media_has_caption (no speech in it; the dialog's description says the film) -->
    <video
      class="trailer"
      use:start
      poster="{FILM}/poster.webp"
      controls
      playsinline
      preload="metadata"
      width="1920"
      height="1080"
    >
      <source src="{FILM}/dither-ui.mp4" type="video/mp4" />
      <source src="{FILM}/dither-ui.webm" type="video/webm" />
    </video>
  {/if}
</DitherDialog>

<style>
  .trailer {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    background: #000;
  }
</style>
