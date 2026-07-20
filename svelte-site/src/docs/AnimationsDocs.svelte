<script lang="ts">
  import {
    AnimatedContent,
    BlobCursor,
    ClickSpark,
    Crosshair,
    ElectricBorder,
    FadeContent,
    GhostCursor,
    GlareHover,
    GradualBlur,
    ImageTrail,
    Magnet,
    PixelTrail,
    SplashCursor,
    StarBorder,
    TargetCursor,
    MetaBalls,
    MetallicPaint,
    Noise,
    Cubes,
    Ribbons,
    ShapeBlur,
    Strands,
    LaserFlow,
    Antigravity,
    LogoLoop,
    MagicRings,
    MagnetLines,
    OrbitImages,
    PixelTransition,
    StickerPeel,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  const SHARED_CANVAS: PropRow[] = [
    { prop: "opacity", type: "number (0-1)", default: "1" },
    { prop: "dither", type: "number (0-1) | boolean", default: "1" },
    { prop: "paused", type: "boolean", default: "false" },
    { prop: "mixBlendMode", type: "string", default: "undefined" },
    { prop: "seed", type: "number", default: "undefined" },
  ]

  const API: Record<string, PropRow[]> = {
    animatedContent: [
      { prop: "distance", type: "number (px)", default: "40" },
      { prop: "direction", type: '"vertical" | "horizontal"', default: '"vertical"' },
      { prop: "reverse", type: "boolean", default: "false" },
      { prop: "duration", type: "number (ms)", default: "800" },
      { prop: "delay", type: "number (ms)", default: "0" },
      { prop: "children", type: "content", default: "—" },
    ],
    fadeContent: [
      { prop: "duration", type: "number (ms)", default: "1000" },
      { prop: "delay", type: "number (ms)", default: "0" },
      { prop: "blur", type: "boolean", default: "false" },
      { prop: "children", type: "content", default: "—" },
    ],
    gradualBlur: [
      { prop: "position", type: '"bottom" | "top"', default: '"bottom"' },
      { prop: "height", type: "number (px)", default: "96" },
      { prop: "strength", type: "number (px)", default: "4" },
      { prop: "children", type: "content", default: "—" },
    ],
    starBorder: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "speed", type: "number (s)", default: "6" },
      { prop: "thickness", type: "number (px)", default: "1" },
      { prop: "children", type: "content", default: "—" },
    ],
    electricBorder: [
      { prop: "color", type: "string (hex)", default: '"#5227FF"' },
      { prop: "speed", type: "number", default: "1" },
      { prop: "thickness", type: "number (px)", default: "2" },
      { prop: "children", type: "content", default: "—" },
    ],
    glareHover: [{ prop: "children", type: "content", default: "—" }],
    magnet: [
      { prop: "strength", type: "number (0-1)", default: "0.4" },
      { prop: "radius", type: "number (px)", default: "200" },
      { prop: "children", type: "content", default: "—" },
    ],
    clickSpark: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "count", type: "number", default: "8" },
      { prop: "size", type: "number (px)", default: "16" },
      { prop: "duration", type: "number (ms)", default: "420" },
      { prop: "children", type: "content", default: "—" },
    ],
    blobCursor: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "size", type: "number (px)", default: "48" },
      { prop: "lag", type: "number (0-1)", default: "0.18" },
      { prop: "children", type: "content", default: "—" },
    ],
    crosshair: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "thickness", type: "number (px)", default: "1" },
      { prop: "children", type: "content", default: "—" },
    ],
    ghostCursor: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "count", type: "number", default: "18" },
      { prop: "size", type: "number (px)", default: "10" },
      { prop: "children", type: "content", default: "—" },
    ],
    splashCursor: [
      { prop: "color", type: "string (hex)", default: '"#3DA5FF"' },
      { prop: "maxRadius", type: "number (px)", default: "60" },
      { prop: "duration", type: "number (ms)", default: "700" },
      { prop: "children", type: "content", default: "—" },
    ],
    targetCursor: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "size", type: "number (px)", default: "36" },
      { prop: "children", type: "content", default: "—" },
    ],
    pixelTrail: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "gap", type: "number (px)", default: "24" },
      { prop: "children", type: "content", default: "—" },
    ],
    imageTrail: [
      { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', ...]" },
      { prop: "size", type: "number (px)", default: "40" },
      { prop: "duration", type: "number (ms)", default: "650" },
      { prop: "children", type: "content", default: "—" },
    ],
    metaBalls: [
      { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', '#3DA5FF']" },
      { prop: "count", type: "number", default: "6" },
      { prop: "speed", type: "number", default: "1" },
      { prop: "ballSize", type: "number", default: "1" },
      { prop: "glow", type: "number", default: "1.5" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      ...SHARED_CANVAS,
    ],
    metallicPaint: [
      { prop: "colors", type: "string[] (hex)", default: "['#1A1A22', '#8890A0', '#E8ECF4']" },
      { prop: "scale", type: "number", default: "3" },
      { prop: "speed", type: "number", default: "0.4" },
      { prop: "distortion", type: "number", default: "0.6" },
      ...SHARED_CANVAS,
    ],
    noise: [
      { prop: "colors", type: "string[] (hex)", default: "['#3DA5FF', '#7CE0FF', '#FFFFFF']" },
      { prop: "speed", type: "number", default: "1" },
      { prop: "density", type: "number (0-1)", default: "0.5" },
      { prop: "opacity", type: "number (0-1)", default: "1" },
      { prop: "paused", type: "boolean", default: "false" },
    ],
    cubes: [
      { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', '#CFFFDF']" },
      { prop: "scale", type: "number", default: "6" },
      { prop: "speed", type: "number", default: "0.4" },
      ...SHARED_CANVAS,
    ],
    ribbons: [
      { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', '#3DA5FF']" },
      { prop: "count", type: "number", default: "5" },
      { prop: "thickness", type: "number", default: "0.12" },
      { prop: "amplitude", type: "number", default: "1" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      ...SHARED_CANVAS,
    ],
    shapeBlur: [
      { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67']" },
      { prop: "size", type: "number", default: "0.4" },
      { prop: "softness", type: "number", default: "0.3" },
      { prop: "mouseInteraction", type: "boolean", default: "true" },
      ...SHARED_CANVAS,
    ],
    strands: [
      { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CE0FF']" },
      { prop: "count", type: "number", default: "40" },
      { prop: "sway", type: "number", default: "0.15" },
      { prop: "lineWidth", type: "number", default: "0.01" },
      ...SHARED_CANVAS,
    ],
    laserFlow: [
      { prop: "colors", type: "string[] (hex)", default: "['#FF3D2E', '#FFD23D', '#FFFFFF']" },
      { prop: "count", type: "number", default: "4" },
      { prop: "beamWidth", type: "number", default: "0.02" },
      { prop: "glow", type: "number", default: "1" },
      ...SHARED_CANVAS,
    ],
    antigravity: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "count", type: "number", default: "40" },
      { prop: "speed", type: "number", default: "1" },
      { prop: "children", type: "content", default: "—" },
    ],
    logoLoop: [
      { prop: "items", type: "string[]", default: "['DITHER', 'BAYER', ...]" },
      { prop: "speed", type: "number (s)", default: "18" },
      { prop: "gap", type: "number (px)", default: "48" },
    ],
    magicRings: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "count", type: "number", default: "4" },
      { prop: "duration", type: "number (s)", default: "3" },
      { prop: "children", type: "content", default: "—" },
    ],
    magnetLines: [
      { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
      { prop: "gap", type: "number (px)", default: "28" },
      { prop: "lineLength", type: "number (px)", default: "14" },
      { prop: "children", type: "content", default: "—" },
    ],
    orbitImages: [
      { prop: "items", type: "string[]", default: "['A', 'B', 'C', 'D', 'E']" },
      { prop: "radius", type: "number (px)", default: "80" },
      { prop: "duration", type: "number (s)", default: "16" },
      { prop: "size", type: "number (px)", default: "200" },
    ],
    pixelTransition: [
      { prop: "rows", type: "number", default: "6" },
      { prop: "cols", type: "number", default: "10" },
      { prop: "color", type: "string (hex)", default: '"#111318"' },
      { prop: "children", type: "content", default: "—" },
    ],
    stickerPeel: [{ prop: "children", type: "content", default: "—" }],
  }

  const SNIPPETS = {
    animatedContent: `<AnimatedContent distance={40} direction="vertical">
  <YourCard />
</AnimatedContent>`,
    fadeContent: `<FadeContent blur={true}>
  <YourCard />
</FadeContent>`,
    gradualBlur: `<GradualBlur position="bottom" height={96}>
  <ScrollingList />
</GradualBlur>`,
    starBorder: `<StarBorder color="#7CFF67">Star border</StarBorder>`,
    electricBorder: `<ElectricBorder color="#5227FF">Electric border</ElectricBorder>`,
    glareHover: `<GlareHover><YourCard /></GlareHover>`,
    magnet: `<Magnet strength={0.4}><button>Magnet</button></Magnet>`,
    clickSpark: `<ClickSpark color="#7CFF67"><YourArea /></ClickSpark>`,
    blobCursor: `<BlobCursor color="#7CFF67" class="h-40"><YourArea /></BlobCursor>`,
    crosshair: `<Crosshair color="#7CFF67" class="h-40"><YourArea /></Crosshair>`,
    ghostCursor: `<GhostCursor color="#7CFF67" class="h-40"><YourArea /></GhostCursor>`,
    splashCursor: `<SplashCursor color="#3DA5FF" class="h-40"><YourArea /></SplashCursor>`,
    targetCursor: `<TargetCursor color="#7CFF67" class="h-40"><YourArea /></TargetCursor>`,
    pixelTrail: `<PixelTrail color="#7CFF67" class="h-40"><YourArea /></PixelTrail>`,
    imageTrail: `<ImageTrail class="h-44"><YourArea /></ImageTrail>`,
    metaBalls: `<MetaBalls class="h-64" />`,
    metallicPaint: `<MetallicPaint class="h-64" />`,
    noise: `<Noise class="h-64" />`,
    cubes: `<Cubes class="h-64" />`,
    ribbons: `<Ribbons class="h-64" />`,
    shapeBlur: `<ShapeBlur class="h-64" />`,
    strands: `<Strands class="h-64" />`,
    laserFlow: `<LaserFlow class="h-64" />`,
    antigravity: `<Antigravity class="h-52"><YourContent /></Antigravity>`,
    logoLoop: `<LogoLoop items={['DITHER', 'BAYER', 'CANVAS', 'VUE', 'PIXELS']} />`,
    magicRings: `<MagicRings class="h-52"><YourContent /></MagicRings>`,
    magnetLines: `<MagnetLines class="h-52" />`,
    orbitImages: `<OrbitImages items={['A', 'B', 'C', 'D', 'E']} />`,
    pixelTransition: `<PixelTransition><YourCard /></PixelTransition>`,
    stickerPeel: `<StickerPeel><YourCard /></StickerPeel>`,
  }

  const cardBox = "grid h-28 w-52 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground"
  const cursorArea = "grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground"
  const canvasBox = "h-64 w-full overflow-hidden rounded-lg border border-border/60"
</script>

<!-- Animated content -->
<section id="animated-content" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Animated content</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Wrap anything to have it slide and fade into place the first time it enters
    the viewport. Direction, distance and timing are configurable.
  </p>
  <DemoCard code={SNIPPETS.animatedContent}>
    <AnimatedContent distance={40}><div class={cardBox}>Slides up on view</div></AnimatedContent>
  </DemoCard>
  <PropsTable rows={API.animatedContent} />
</section>

<!-- Fade content -->
<section id="fade-content" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Fade content</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A pure fade-in on view, optionally de-blurring as it appears. The lighter
    cousin of Animated content when you only want opacity.
  </p>
  <DemoCard code={SNIPPETS.fadeContent}>
    <FadeContent blur={true}><div class={cardBox}>Fades in on view</div></FadeContent>
  </DemoCard>
  <PropsTable rows={API.fadeContent} />
</section>

<!-- Gradual blur -->
<section id="gradual-blur" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Gradual blur</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A masked <code class="text-foreground/80">backdrop-filter</code> strip that
    progressively blurs toward an edge — the iOS-style soft fade over a scroll
    region.
  </p>
  <DemoCard code={SNIPPETS.gradualBlur}>
    <GradualBlur position="bottom" height={72} strength={5} class="w-64">
      <div class="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
        {#each [1, 2, 3, 4, 5, 6] as n (n)}
          <p>Row {n} — content scrolls under the blur band.</p>
        {/each}
      </div>
    </GradualBlur>
  </DemoCard>
  <PropsTable rows={API.gradualBlur} />
</section>

<!-- Star border -->
<section id="star-border" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Star border</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A rounded frame with two bright glints traveling its top and bottom edges —
    a subtle animated outline for a CTA or badge.
  </p>
  <DemoCard code={SNIPPETS.starBorder}>
    <StarBorder color="#7CFF67">Star border</StarBorder>
  </DemoCard>
  <PropsTable rows={API.starBorder} />
</section>

<!-- Electric border -->
<section id="electric-border" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Electric border</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    An SVG turbulence filter jitters the frame edge into a crackling electric
    outline. Reduced motion drops the displacement.
  </p>
  <DemoCard code={SNIPPETS.electricBorder}>
    <ElectricBorder color="#5227FF">Electric border</ElectricBorder>
  </DemoCard>
  <PropsTable rows={API.electricBorder} />
</section>

<!-- Glare hover -->
<section id="glare-hover" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Glare hover</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A diagonal sheen sweeps across the surface on hover — the glossy-card
    reflection, done with a single masked gradient. Hover the card.
  </p>
  <DemoCard code={SNIPPETS.glareHover}>
    <GlareHover><div class={cardBox}>Hover me</div></GlareHover>
  </DemoCard>
  <PropsTable rows={API.glareHover} />
</section>

<!-- Magnet -->
<section id="magnet" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Magnet</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The wrapped element is pulled toward the pointer while it is within range,
    easing back when the cursor leaves. Move your cursor near the button.
  </p>
  <DemoCard code={SNIPPETS.magnet}>
    <Magnet strength={0.4}>
      <button type="button" class="rounded-md border border-border/60 bg-card px-4 py-2 text-sm">Magnet</button>
    </Magnet>
  </DemoCard>
  <PropsTable rows={API.magnet} />
</section>

<!-- Click spark -->
<section id="click-spark" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Click spark</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A burst of spark lines radiates from every click inside the area, drawn on a
    lightweight canvas overlay. Click anywhere in the preview.
  </p>
  <DemoCard code={SNIPPETS.clickSpark}>
    <ClickSpark color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border border-border/60">
      <span class="text-sm text-muted-foreground">Click anywhere here</span>
    </ClickSpark>
  </DemoCard>
  <PropsTable rows={API.clickSpark} />
</section>

<!-- Blob cursor -->
<section id="blob-cursor" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Blob cursor</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A soft, screen-blended blob eases toward the pointer inside the area — a
    gooey cursor companion. Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.blobCursor}>
    <BlobCursor class={cursorArea}>Move your cursor here</BlobCursor>
  </DemoCard>
  <PropsTable rows={API.blobCursor} />
</section>

<!-- Crosshair -->
<section id="crosshair" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Crosshair</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Full-height and full-width guide lines track the pointer across the area — a
    precision reticle. Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.crosshair}>
    <Crosshair class={cursorArea}>Move your cursor here</Crosshair>
  </DemoCard>
  <PropsTable rows={API.crosshair} />
</section>

<!-- Ghost cursor -->
<section id="ghost-cursor" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Ghost cursor</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A tapering trail of fading dots chases the pointer on a canvas overlay.
    Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.ghostCursor}>
    <GhostCursor class={cursorArea}>Move your cursor here</GhostCursor>
  </DemoCard>
  <PropsTable rows={API.ghostCursor} />
</section>

<!-- Splash cursor -->
<section id="splash-cursor" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Splash cursor</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Expanding ripple rings bloom along the pointer path, like drops on water.
    Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.splashCursor}>
    <SplashCursor class={cursorArea}>Move your cursor here</SplashCursor>
  </DemoCard>
  <PropsTable rows={API.splashCursor} />
</section>

<!-- Target cursor -->
<section id="target-cursor" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Target cursor</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A slowly rotating corner-bracket reticle locks onto the pointer — a HUD
    targeting frame. Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.targetCursor}>
    <TargetCursor class={cursorArea}>Move your cursor here</TargetCursor>
  </DemoCard>
  <PropsTable rows={API.targetCursor} />
</section>

<!-- Pixel trail -->
<section id="pixel-trail" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pixel trail</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The pointer lights up cells of a pixel grid that then fade back out — a
    glowing wake across the lattice. Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.pixelTrail}>
    <PixelTrail class={cursorArea}>Move your cursor here</PixelTrail>
  </DemoCard>
  <PropsTable rows={API.pixelTrail} />
</section>

<!-- Image trail -->
<section id="image-trail" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Image trail</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Tiles from a palette drop along the pointer path, rotating and shrinking as
    they fade — pass real image URLs via <code class="text-foreground/80">colors</code>
    swapped for tiles here. Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.imageTrail}>
    <ImageTrail class="grid h-44 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">Move your cursor here</ImageTrail>
  </DemoCard>
  <PropsTable rows={API.imageTrail} />
</section>

<!-- Meta balls -->
<section id="meta-balls" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Meta balls</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Orbiting blobs fuse into a gooey metaball iso-surface, tinted and
    ordered-dithered through the kit engine. The pointer adds a blob.
  </p>
  <DemoCard code={SNIPPETS.metaBalls}>
    <div class={canvasBox}><MetaBalls /></div>
  </DemoCard>
  <PropsTable rows={API.metaBalls} />
</section>

<!-- Metallic paint -->
<section id="metallic-paint" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Metallic paint</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Iterative domain-warped reflections read as flowing liquid chrome — fully
    opaque, dithered across a metallic ramp.
  </p>
  <DemoCard code={SNIPPETS.metallicPaint}>
    <div class={canvasBox}><MetallicPaint /></div>
  </DemoCard>
  <PropsTable rows={API.metallicPaint} />
</section>

<!-- Noise -->
<section id="noise" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Noise</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Animated hashed grain thresholded against the Bayer matrix — living static
    for a texture overlay. Tune <code class="text-foreground/80">density</code> and blend it over content.
  </p>
  <DemoCard code={SNIPPETS.noise}>
    <div class={canvasBox}><Noise /></div>
  </DemoCard>
  <PropsTable rows={API.noise} />
</section>

<!-- Cubes -->
<section id="cubes" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Cubes</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A rhombille tiling shades into a field of isometric cubes, each face lit and
    pulsing on noise. Tinted and ordered-dithered.
  </p>
  <DemoCard code={SNIPPETS.cubes}>
    <div class={canvasBox}><Cubes /></div>
  </DemoCard>
  <PropsTable rows={API.cubes} />
</section>

<!-- Ribbons -->
<section id="ribbons" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Ribbons</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Thick flowing bands ride wavy fbm centerlines, bright at the core and tinted
    per ribbon. The pointer bends nearby ribbons toward it.
  </p>
  <DemoCard code={SNIPPETS.ribbons}>
    <div class={canvasBox}><Ribbons /></div>
  </DemoCard>
  <PropsTable rows={API.ribbons} />
</section>

<!-- Shape blur -->
<section id="shape-blur" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Shape blur</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A big soft blob morphs on noise and drifts toward the pointer — a gentle
    out-of-focus shape. Move your cursor over it.
  </p>
  <DemoCard code={SNIPPETS.shapeBlur}>
    <div class={canvasBox}><ShapeBlur /></div>
  </DemoCard>
  <PropsTable rows={API.shapeBlur} />
</section>

<!-- Strands -->
<section id="strands" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Strands</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Dozens of thin filaments sway on fbm like blown hair, tinted by depth and
    ordered-dithered with transparent gaps.
  </p>
  <DemoCard code={SNIPPETS.strands}>
    <div class={canvasBox}><Strands /></div>
  </DemoCard>
  <PropsTable rows={API.strands} />
</section>

<!-- Laser flow -->
<section id="laser-flow" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Laser flow</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Sharp horizontal beams sweep with additive bloom and a faint jitter, tinted
    per beam — a scanning laser array.
  </p>
  <DemoCard code={SNIPPETS.laserFlow}>
    <div class={canvasBox}><LaserFlow /></div>
  </DemoCard>
  <PropsTable rows={API.laserFlow} />
</section>

<!-- Antigravity -->
<section id="antigravity" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Antigravity</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A field of motes drifts upward and wraps — gravity in reverse, layered
    behind your content.
  </p>
  <DemoCard code={SNIPPETS.antigravity}>
    <Antigravity class={cursorArea}>Antigravity</Antigravity>
  </DemoCard>
  <PropsTable rows={API.antigravity} />
</section>

<!-- Logo loop -->
<section id="logo-loop" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Logo loop</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A seamless infinite marquee of items — pass logos or wordmarks and it loops
    forever with a measured wrap.
  </p>
  <DemoCard code={SNIPPETS.logoLoop}>
    <div class="w-full text-xl font-medium tracking-tight text-muted-foreground">
      <LogoLoop items={['DITHER', 'BAYER', 'CANVAS', 'VUE', 'PIXELS']} />
    </div>
  </DemoCard>
  <PropsTable rows={API.logoLoop} />
</section>

<!-- Magic rings -->
<section id="magic-rings" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Magic rings</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Concentric rings pulse outward from the center on a stagger — a radar-ping
    halo around whatever you wrap.
  </p>
  <DemoCard code={SNIPPETS.magicRings}>
    <MagicRings class="h-52 w-full">
      <span class="grid h-12 w-12 place-items-center rounded-full border border-border/60 bg-card text-xs text-muted-foreground">core</span>
    </MagicRings>
  </DemoCard>
  <PropsTable rows={API.magicRings} />
</section>

<!-- Magnet lines -->
<section id="magnet-lines" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Magnet lines</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A grid of little needles all swivel to point at the pointer, like iron
    filings over a magnet. Move your cursor over the box.
  </p>
  <DemoCard code={SNIPPETS.magnetLines}>
    <MagnetLines class={cursorArea} />
  </DemoCard>
  <PropsTable rows={API.magnetLines} />
</section>

<!-- Orbit images -->
<section id="orbit-images" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Orbit images</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Items ride a circular orbit around a center point — pass avatars, logos or
    labels. Counter-rotated so they stay upright.
  </p>
  <DemoCard code={SNIPPETS.orbitImages}>
    <div class="grid min-h-56 place-items-center">
      <OrbitImages items={['A', 'B', 'C', 'D', 'E']} />
    </div>
  </DemoCard>
  <PropsTable rows={API.orbitImages} />
</section>

<!-- Pixel transition -->
<section id="pixel-transition" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pixel transition</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A grid of pixel cells covers the content and dissolves in a scattered order
    on hover, revealing what is underneath. Hover the card.
  </p>
  <DemoCard code={SNIPPETS.pixelTransition}>
    <PixelTransition class="grid h-32 w-56 place-items-center rounded-lg border border-border/60" color="#181b22">
      <span class="text-lg tracking-tight">Revealed</span>
    </PixelTransition>
  </DemoCard>
  <PropsTable rows={API.pixelTransition} />
</section>

<!-- Sticker peel -->
<section id="sticker-peel" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Sticker peel</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A corner of the card peels up on hover with a soft curl shadow — the sticker
    lift. Hover the card.
  </p>
  <DemoCard code={SNIPPETS.stickerPeel}>
    <StickerPeel>
      <div class="grid h-24 w-40 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground">Peel me</div>
    </StickerPeel>
  </DemoCard>
  <PropsTable rows={API.stickerPeel} />
</section>
