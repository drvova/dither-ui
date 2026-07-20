<script lang="ts">
  import {
    DitherButton,
    DitherAvatar,
    DitherGradient,
    DitherImage,
    cssColor,
    type ButtonVariant,
    type GradientDirection,
    type DitherColor,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable from "./PropsTable.svelte"

  type Bloom = "off" | "low" | "high" | "aura"

  // Button playground — one preview, three pickers.
  let btn = $state<{ variant: ButtonVariant; color: DitherColor; bloom: Bloom }>({
    variant: "gradient",
    color: "blue",
    bloom: "off",
  })
  const VARIANTS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
  const BLOOMS: Bloom[] = ["off", "low", "high", "aura"]
  const BUTTON_COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red"]

  // Avatar playground — picking a name replays the pixel entrance at all sizes.
  const AVATAR_NAMES = ["ada", "linus", "grace", "alan", "edsger", "barbara"]
  let avatarName = $state("ada")
  let avatarReplay = $state(0)
  function pickAvatar(n: string) {
    avatarName = n
    avatarReplay++
  }

  // Gradient playground.
  let grad = $state<{ direction: GradientDirection; from: DitherColor }>({ direction: "up", from: "blue" })
  const DIRECTIONS: GradientDirection[] = ["up", "down", "left", "right"]
  const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]

  const chipClass = (active: boolean) =>
    `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`
  const thumbClass = (active: boolean) =>
    `rounded-md p-2 text-left transition-colors ${active ? "bg-card" : "hover:bg-card/50"}`
  const thumbLabel = (active: boolean) =>
    `mt-2 text-center text-[10px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`

  const imageSnippet = `<DitherImage src="/faces.webp" cell={3} focusY={0.62} fade={72}
  alt="The dither-ui face band, re-dithered" class="h-64 w-full" />
<DitherImage precompiled="/faces-dither.png" alt="The dither-ui face band" />
<!-- cell: px per dither cell · fade: dithered edge dissolve
     focusY: cover-crop focus (0 top … 1 bottom) -->`

  // Code tabs mirror the picked state — what you see is what you copy.
  const buttonCode = $derived(
    `<DitherButton color="${btn.color}" variant="${btn.variant}"${btn.bloom === "off" ? "" : ` bloom="${btn.bloom}"`}>
  Deploy
</DitherButton>
<DitherButton renderMode="static" precompiled="/button.png">Saved</DitherButton>`
  )
  const avatarCode = $derived(
    `<DitherAvatar name="${avatarName}" size={48} />
<!-- same name, same face — at any size -->`
  )
  const gradientCode = $derived(
    `<div class="relative h-40">
  <DitherGradient from="${grad.from}" to="transparent" direction="${grad.direction}" />
</div>
<div class="relative h-24">
  <DitherGradient renderMode="static" precompiled="/gradient.png" />
</div>`
  )

  const buttonRowsApi = [
    { prop: "color", type: "PixelColor", default: "seed / blue" },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: "seed / gradient" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "cell", type: "number (px)", default: "seed / 2" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "type", type: '"button" | "submit" | "reset"', default: '"button"' },
    { prop: "loading / disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src; width?; height? }", default: "undefined" },
    { prop: "maxCols / maxRows", type: "number", default: "960 / 600 (live) · 320 / 200 (static)" },
  ]
  const avatarRowsApi = [
    { prop: "name", type: "string", default: "—" },
    { prop: "size", type: "number (px)", default: "—" },
    { prop: "hue", type: "number 0…360", default: "from name" },
    { prop: "mirror", type: '"auto" | "horizontal" | "vertical"', default: '"auto"' },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura"', default: '"off"' },
  ]
  const gradientRowsApi = [
    { prop: "from", type: "PixelColor", default: "seed / blue" },
    { prop: "to", type: 'PixelColor | "transparent"', default: '"transparent"' },
    { prop: "direction", type: '"up" | "down" | "left" | "right"', default: "seed / up" },
    { prop: "cell", type: "number (px)", default: "seed / 3" },
    { prop: "opacity", type: "number 0…1", default: "seed / 1" },
    { prop: "bloom", type: '"off" | "low" | "high" | "aura" | object | number', default: "seed / off" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src; width?; height? }", default: "undefined" },
    { prop: "maxCols / maxRows", type: "number", default: "960 / 600 (live) · 320 / 200 (static)" },
  ]
  const imageRowsApi = [
    { prop: "src", type: "string", default: "required" },
    { prop: "cell", type: "number (px)", default: "seed / 3" },
    { prop: "focusY", type: "number 0…1", default: "seed / 0.5" },
    { prop: "fade", type: "number (px)", default: "seed / 0" },
    { prop: "seed", type: "number", default: "undefined" },
    { prop: "alt", type: "string", default: '""' },
    { prop: "class", type: "string", default: "undefined" },
    { prop: "renderMode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src; width?; height? }", default: "undefined" },
    { prop: "maxCols / maxRows", type: "number", default: "960 / 600 (live) · 320 / 200 (static)" },
  ]
</script>

<!-- Button -->
<section id="button" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Button</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Canvas-filled button; density lifts on hover, blooms on press. Four fills,
    seven colors, optional <code class="text-foreground/80">bloom</code>, and
    static/precompiled raster paths.
  </p>
  <DemoCard code={buttonCode}>
    <div class="grid justify-items-center gap-8">
      <DitherButton color={btn.color} variant={btn.variant} bloom={btn.bloom} class="px-6 py-3 text-[13px]">
        Deploy
      </DitherButton>
      <div class="grid justify-items-center gap-3">
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          {#each VARIANTS as v (v)}
            <button type="button" aria-pressed={btn.variant === v} class={chipClass(btn.variant === v)} onclick={() => (btn.variant = v)}>{v}</button>
          {/each}
        </div>
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          {#each BLOOMS as b (b)}
            <button type="button" aria-pressed={btn.bloom === b} class={chipClass(btn.bloom === b)} onclick={() => (btn.bloom = b)}>bloom {b}</button>
          {/each}
        </div>
        <div class="flex items-center gap-2">
          {#each BUTTON_COLORS as c (c)}
            <button
              type="button"
              aria-label="Color {c}"
              aria-pressed={btn.color === c}
              class="size-6 rounded-[4px] transition-transform {btn.color === c
                ? 'ring-1 ring-foreground ring-offset-2 ring-offset-background'
                : 'hover:scale-110'}"
              style:background-color={cssColor(c)}
              onclick={() => (btn.color = c)}
            ></button>
          {/each}
        </div>
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={buttonRowsApi} />
</section>

<!-- Avatar -->
<section id="avatar" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Avatar</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Deterministic identicon — the same name always draws the same face, at any
    size.
  </p>
  <DemoCard code={avatarCode}>
    <div class="flex items-end justify-center gap-3">
      <DitherAvatar name={avatarName} size={24} replayToken={avatarReplay} />
      <DitherAvatar name={avatarName} size={32} replayToken={avatarReplay} />
      <DitherAvatar name={avatarName} size={48} replayToken={avatarReplay} />
      <DitherAvatar name={avatarName} size={64} replayToken={avatarReplay} />
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">names</h3>
  <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
    {#each AVATAR_NAMES as n (n)}
      <button type="button" aria-pressed={avatarName === n} class={thumbClass(avatarName === n)} onclick={() => pickAvatar(n)}>
        <div class="pointer-events-none flex justify-center">
          <DitherAvatar name={n} size={40} animate={false} />
        </div>
        <div class={thumbLabel(avatarName === n)}>{n}</div>
      </button>
    {/each}
  </div>
  <PropsTable rows={avatarRowsApi} />
</section>

<!-- Gradient -->
<section id="gradient" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Gradient</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    A background wash that fades through the Bayer matrix instead of alpha — four
    directions, any palette color.
  </p>
  <DemoCard code={gradientCode}>
    <div class="grid gap-5">
      <div class="relative h-40 overflow-hidden rounded-md">
        <DitherGradient from={grad.from} to="transparent" direction={grad.direction} />
      </div>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          {#each DIRECTIONS as dir (dir)}
            <button type="button" aria-pressed={grad.direction === dir} class={chipClass(grad.direction === dir)} onclick={() => (grad.direction = dir)}>{dir}</button>
          {/each}
        </div>
        <div class="flex items-center gap-2">
          {#each COLORS as c (c)}
            <button
              type="button"
              aria-label="Color {c}"
              aria-pressed={grad.from === c}
              class="size-6 rounded-[4px] transition-transform {grad.from === c
                ? 'ring-1 ring-foreground ring-offset-2 ring-offset-background'
                : 'hover:scale-110'}"
              style:background-color={cssColor(c)}
              onclick={() => (grad.from = c)}
            ></button>
          {/each}
        </div>
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={gradientRowsApi} />
</section>

<!-- Image -->
<section id="image" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Image</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Ordered-dithers any image into chunky cells; edges can dissolve into the
    page. Below: the site's own face band run through it.
  </p>
  <DemoCard code={imageSnippet}>
    <DitherImage
      src="/faces.webp"
      alt="The dither-ui face band, re-dithered"
      cell={3}
      focusY={0.62}
      fade={72}
      class="h-64 w-full"
    />
  </DemoCard>
  <PropsTable rows={imageRowsApi} />
</section>
