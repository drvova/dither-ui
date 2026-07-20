<script lang="ts">
  import {
    GradientText,
    ShinyText,
    GlitchText,
    SplitText,
    RotatingText,
    CountUp,
    TextType,
    BlurText,
    DecryptedText,
    ScrambleText,
    Shuffle,
    FallingText,
    ScrollReveal,
    ScrollFloat,
    ScrollVelocity,
    TextCursor,
    TextPressure,
    VariableProximity,
    TrueFocus,
    CircularText,
    CurvedLoop,
    FuzzyText,
    AsciiText,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  let splitReplay = $state(0)
  let shuffleReplay = $state(0)
  let fallingReplay = $state(0)

  const API: Record<string, PropRow[]> = {
    gradientText: [
      { prop: "colors", type: "string[] (hex)", default: "['#358ff3', '#7CFF67', '#358ff3']" },
      { prop: "speed", type: "number", default: "1" },
      { prop: "class", type: "string", default: "undefined" },
      { prop: "children", type: "text", default: "—" },
    ],
    shinyText: [
      { prop: "speed", type: "number", default: "1" },
      { prop: "disabled", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "undefined" },
      { prop: "children", type: "text", default: "—" },
    ],
    glitchText: [
      { prop: "text", type: "string", default: '"GLITCH"' },
      { prop: "speed", type: "number", default: "1" },
      { prop: "class", type: "string", default: "undefined" },
    ],
    splitText: [
      { prop: "text", type: "string", default: '"Split text"' },
      { prop: "stagger", type: "number (ms/char)", default: "40" },
      { prop: "duration", type: "number (ms)", default: "600" },
      { prop: "replayToken", type: "number", default: "0" },
      { prop: "class", type: "string", default: "undefined" },
    ],
    rotatingText: [
      { prop: "texts", type: "string[]", default: "['Vue', 'canvas', 'dither']" },
      { prop: "interval", type: "number (ms)", default: "2000" },
      { prop: "class", type: "string", default: "undefined" },
    ],
    countUp: [
      { prop: "to", type: "number", default: "required" },
      { prop: "from", type: "number", default: "0" },
      { prop: "duration", type: "number (ms)", default: "1500" },
      { prop: "decimals", type: "number", default: "0" },
      { prop: "class", type: "string", default: "undefined" },
    ],
    textType: [
      { prop: "texts", type: "string[]", default: "['Type this out.', 'Then this.']" },
      { prop: "typingSpeed", type: "number (ms)", default: "60" },
      { prop: "deletingSpeed", type: "number (ms)", default: "35" },
      { prop: "pause", type: "number (ms)", default: "1400" },
      { prop: "loop", type: "boolean", default: "true" },
      { prop: "cursor", type: "boolean", default: "true" },
    ],
    blurText: [
      { prop: "text", type: "string", default: '"Blur into focus"' },
      { prop: "by", type: '"words" | "chars"', default: '"words"' },
      { prop: "stagger", type: "number (ms)", default: "90" },
      { prop: "duration", type: "number (ms)", default: "600" },
    ],
    decryptedText: [
      { prop: "text", type: "string", default: '"DECRYPTED"' },
      { prop: "speed", type: "number", default: "1" },
      { prop: "trigger", type: '"view" | "hover"', default: '"view"' },
    ],
    scrambleText: [
      { prop: "text", type: "string", default: '"Hover to scramble"' },
      { prop: "speed", type: "number", default: "1" },
    ],
    shuffle: [
      { prop: "text", type: "string", default: '"Shuffle in"' },
      { prop: "stagger", type: "number (ms)", default: "55" },
      { prop: "duration", type: "number (ms)", default: "650" },
      { prop: "replayToken", type: "number", default: "0" },
    ],
    fallingText: [
      { prop: "text", type: "string", default: '"Falling text"' },
      { prop: "stagger", type: "number (ms)", default: "45" },
      { prop: "duration", type: "number (ms)", default: "700" },
      { prop: "replayToken", type: "number", default: "0" },
    ],
    scrollReveal: [
      { prop: "text", type: "string", default: "required" },
      { prop: "class", type: "string", default: "undefined" },
    ],
    scrollFloat: [
      { prop: "text", type: "string", default: "required" },
      { prop: "amount", type: "number", default: "1" },
    ],
    scrollVelocity: [
      { prop: "text", type: "string", default: '"DITHER · UI · TOOLKIT ·"' },
      { prop: "baseSpeed", type: "number (px/s)", default: "60" },
    ],
    textCursor: [
      { prop: "text", type: "string", default: '"dither"' },
      { prop: "class", type: "string", default: "undefined" },
    ],
    textPressure: [
      { prop: "text", type: "string", default: '"Pressure"' },
      { prop: "radius", type: "number (px)", default: "140" },
      { prop: "strength", type: "number", default: "1" },
    ],
    variableProximity: [
      { prop: "text", type: "string", default: "required" },
      { prop: "radius", type: "number (px)", default: "120" },
    ],
    trueFocus: [
      { prop: "text", type: "string", default: '"True focus mode"' },
      { prop: "interval", type: "number (ms)", default: "1400" },
      { prop: "blur", type: "number (px)", default: "5" },
    ],
    circularText: [
      { prop: "text", type: "string", default: '"DITHER · UI · TOOLKIT ·"' },
      { prop: "duration", type: "number (s)", default: "12" },
      { prop: "size", type: "number (px)", default: "170" },
    ],
    curvedLoop: [
      { prop: "text", type: "string", default: '"DITHER UI · CANVAS + BAYER ·"' },
      { prop: "speed", type: "number (units/s)", default: "60" },
    ],
    fuzzyText: [
      { prop: "text", type: "string", default: '"FUZZY"' },
      { prop: "intensity", type: "number", default: "4" },
    ],
    asciiText: [
      { prop: "text", type: "string", default: '"DITHER"' },
      { prop: "cols", type: "number", default: "64" },
    ],
  }

  const SNIPPETS = {
    gradientText: `<GradientText colors={['#358ff3', '#7CFF67', '#358ff3']}>
  Beautifully dithered
</GradientText>`,
    shinyText: `<ShinyText>Shimmering headline</ShinyText>`,
    glitchText: `<GlitchText text="MALFUNCTION" />`,
    splitText: `<SplitText text="Split into characters" replayToken={token} />`,
    rotatingText: `Built for <RotatingText texts={['Vue', 'canvas', 'the studio']} />`,
    countUp: `<CountUp to={1984} /> renders <!-- counts up when scrolled into view -->`,
    textType: `<TextType texts={['Charts, dithered.', 'Buttons, dithered.', 'Everything, dithered.']} />`,
    blurText: `<BlurText text="Blur into focus" by="words" />`,
    decryptedText: `<DecryptedText text="ACCESS GRANTED" />`,
    scrambleText: `<ScrambleText text="Hover to scramble" />`,
    shuffle: `<Shuffle text="Shuffled into place" replayToken={token} />`,
    fallingText: `<FallingText text="Falling into place" replayToken={token} />`,
    scrollReveal: `<ScrollReveal text="These words reveal as you scroll them into view" />`,
    scrollFloat: `<ScrollFloat text="Floating up on scroll" />`,
    scrollVelocity: `<ScrollVelocity text="DITHER · UI · TOOLKIT · " />`,
    textCursor: `<div class="h-40"><TextCursor text="dither" /></div>`,
    textPressure: `<TextPressure text="Pressure" />`,
    variableProximity: `<VariableProximity text="Move the cursor across this line" />`,
    trueFocus: `<TrueFocus text="True focus mode" />`,
    circularText: `<CircularText text="DITHER · UI · TOOLKIT · " />`,
    curvedLoop: `<CurvedLoop text="DITHER UI · CANVAS + BAYER · " />`,
    fuzzyText: `<FuzzyText text="FUZZY" />`,
    asciiText: `<AsciiText text="DITHER" />`,
  }
</script>

<!-- Gradient text -->
<section id="gradient-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Gradient text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    An animated gradient clipped to the text — the colour band drifts across
    the glyphs forever. Respects reduced motion.
  </p>
  <DemoCard code={SNIPPETS.gradientText}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <GradientText>Beautifully dithered</GradientText>
    </div>
  </DemoCard>
  <PropsTable rows={API.gradientText} />
</section>

<!-- Shiny text -->
<section id="shiny-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Shiny text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A bright highlight sweeps across dim text on a loop — a subtle sheen for
    headlines and labels.
  </p>
  <DemoCard code={SNIPPETS.shinyText}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <ShinyText>Shimmering headline</ShinyText>
    </div>
  </DemoCard>
  <PropsTable rows={API.shinyText} />
</section>

<!-- Glitch text -->
<section id="glitch-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Glitch text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Two RGB-split copies jitter and clip over the base text for a broken-signal
    effect. The base stays readable; the glitch layers hide under reduced motion.
  </p>
  <DemoCard code={SNIPPETS.glitchText}>
    <div class="flex min-h-24 items-center justify-center text-3xl font-medium tracking-tight">
      <GlitchText text="MALFUNCTION" />
    </div>
  </DemoCard>
  <PropsTable rows={API.glitchText} />
</section>

<!-- Split text -->
<section id="split-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Split text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Each character rises and settles on a stagger. Bump
    <code class="text-foreground/80">replayToken</code> to run it again; the
    whole word is still one labelled node for screen readers.
  </p>
  <DemoCard code={SNIPPETS.splitText}>
    <div class="grid min-h-24 place-items-center gap-4">
      <div class="text-3xl tracking-tight">
        <SplitText text="Split into characters" replayToken={splitReplay} />
      </div>
      <button
        type="button"
        class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        onclick={() => splitReplay++}
      >
        Replay
      </button>
    </div>
  </DemoCard>
  <PropsTable rows={API.splitText} />
</section>

<!-- Rotating text -->
<section id="rotating-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Rotating text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Cycles through a list of words, each sliding out as the next slides in —
    for a headline that says several things.
  </p>
  <DemoCard code={SNIPPETS.rotatingText}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <span>Built for&nbsp;</span>
      <RotatingText texts={['Vue', 'canvas', 'the studio']} class="text-foreground" />
    </div>
  </DemoCard>
  <PropsTable rows={API.rotatingText} />
</section>

<!-- Count up -->
<section id="count-up" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Count up</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Eases a number from <code class="text-foreground/80">from</code> to
    <code class="text-foreground/80">to</code> when it scrolls into view —
    locale-formatted, tabular figures. Reduced motion jumps to the final value.
  </p>
  <DemoCard code={SNIPPETS.countUp}>
    <div class="flex min-h-24 items-center justify-center gap-8 text-4xl tracking-tight tabular-nums">
      <CountUp to={1984} />
      <CountUp to={99.9} decimals={1} />
    </div>
  </DemoCard>
  <PropsTable rows={API.countUp} />
</section>

<!-- Text type -->
<section id="text-type" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Text type</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A typewriter that types each string, pauses, deletes and moves to the next —
    with a blinking caret. Reduced motion shows the first line, no typing.
  </p>
  <DemoCard code={SNIPPETS.textType}>
    <div class="flex min-h-24 items-center justify-center text-2xl tracking-tight">
      <TextType texts={['Charts, dithered.', 'Buttons, dithered.', 'Everything, dithered.']} />
    </div>
  </DemoCard>
  <PropsTable rows={API.textType} />
</section>

<!-- Blur text -->
<section id="blur-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Blur text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Words (or characters) blur into focus on a stagger the first time they enter
    the viewport. Still one labelled node for screen readers.
  </p>
  <DemoCard code={SNIPPETS.blurText}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <BlurText text="Blur into focus" />
    </div>
  </DemoCard>
  <PropsTable rows={API.blurText} />
</section>

<!-- Decrypted text -->
<section id="decrypted-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Decrypted text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Scrambled cipher characters resolve left-to-right into the real text when it
    scrolls into view. Monospace keeps the width steady.
  </p>
  <DemoCard code={SNIPPETS.decryptedText}>
    <div class="flex min-h-24 items-center justify-center text-3xl font-medium tracking-tight">
      <DecryptedText text="ACCESS GRANTED" />
    </div>
  </DemoCard>
  <PropsTable rows={API.decryptedText} />
</section>

<!-- Scramble text -->
<section id="scramble-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Scramble text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Hover to burst-scramble the characters, which then settle back to the real
    text. Repeatable on every hover.
  </p>
  <DemoCard code={SNIPPETS.scrambleText}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <ScrambleText text="Hover to scramble" />
    </div>
  </DemoCard>
  <PropsTable rows={API.scrambleText} />
</section>

<!-- Shuffle -->
<section id="shuffle" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Shuffle</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Characters fly in from scattered offsets and rotations, settling into place
    on a stagger. Bump <code class="text-foreground/80">replayToken</code> to run it again.
  </p>
  <DemoCard code={SNIPPETS.shuffle}>
    <div class="grid min-h-24 place-items-center gap-4">
      <div class="text-3xl tracking-tight"><Shuffle text="Shuffled into place" replayToken={shuffleReplay} /></div>
      <button type="button" class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground" onclick={() => shuffleReplay++}>Replay</button>
    </div>
  </DemoCard>
  <PropsTable rows={API.shuffle} />
</section>

<!-- Falling text -->
<section id="falling-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Falling text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Characters drop in from above with a little overshoot bounce, staggered
    across the line.
  </p>
  <DemoCard code={SNIPPETS.fallingText}>
    <div class="grid min-h-24 place-items-center gap-4">
      <div class="text-3xl tracking-tight"><FallingText text="Falling into place" replayToken={fallingReplay} /></div>
      <button type="button" class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground" onclick={() => fallingReplay++}>Replay</button>
    </div>
  </DemoCard>
  <PropsTable rows={API.fallingText} />
</section>

<!-- Scroll reveal -->
<section id="scroll-reveal" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Scroll reveal</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The words fade and de-blur word-by-word as the block travels up through the
    viewport — the reveal is tied to scroll position, not a one-shot. Scroll the page.
  </p>
  <DemoCard code={SNIPPETS.scrollReveal}>
    <div class="flex min-h-24 max-w-md items-center justify-center text-center text-xl leading-relaxed tracking-tight">
      <ScrollReveal text="These words reveal as you scroll them into view" />
    </div>
  </DemoCard>
  <PropsTable rows={API.scrollReveal} />
</section>

<!-- Scroll float -->
<section id="scroll-float" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Scroll float</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Characters float up from an offset as the scroll progress reaches each one —
    a gentle parallax settle. Scroll the page.
  </p>
  <DemoCard code={SNIPPETS.scrollFloat}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <ScrollFloat text="Floating up on scroll" />
    </div>
  </DemoCard>
  <PropsTable rows={API.scrollFloat} />
</section>

<!-- Scroll velocity -->
<section id="scroll-velocity" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Scroll velocity</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A seamless marquee band that drifts on its own and speeds up (or reverses)
    with your scroll velocity, easing back to base speed. Scroll the page.
  </p>
  <DemoCard code={SNIPPETS.scrollVelocity}>
    <div class="w-full text-2xl font-medium tracking-tight text-muted-foreground">
      <ScrollVelocity text="DITHER · UI · TOOLKIT · " />
    </div>
  </DemoCard>
  <PropsTable rows={API.scrollVelocity} />
</section>

<!-- Text cursor -->
<section id="text-cursor" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Text cursor</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The characters of the word trail the pointer inside the box, each lagging a
    little further behind for a ribbon of type. Move your cursor over the preview.
  </p>
  <DemoCard code={SNIPPETS.textCursor}>
    <div class="h-40 w-full text-xl">
      <TextCursor text="dither" />
    </div>
  </DemoCard>
  <PropsTable rows={API.textCursor} />
</section>

<!-- Text pressure -->
<section id="text-pressure" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Text pressure</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Characters bulge — scaling up and gaining weight — near the cursor, like the
    word is being pressed. Move your cursor near the text.
  </p>
  <DemoCard code={SNIPPETS.textPressure}>
    <div class="flex min-h-24 items-center justify-center text-4xl tracking-tight">
      <TextPressure text="Pressure" />
    </div>
  </DemoCard>
  <PropsTable rows={API.textPressure} />
</section>

<!-- Variable proximity -->
<section id="variable-proximity" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Variable proximity</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Each character's weight and opacity ramps with its distance to the pointer —
    no scaling, so a whole sentence stays put while the cursor lights a path
    through it.
  </p>
  <DemoCard code={SNIPPETS.variableProximity}>
    <div class="flex min-h-24 max-w-md items-center justify-center text-center text-xl leading-relaxed tracking-tight">
      <VariableProximity text="Move the cursor across this line to feel the weight shift" />
    </div>
  </DemoCard>
  <PropsTable rows={API.variableProximity} />
</section>

<!-- True focus -->
<section id="true-focus" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">True focus</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    One word stays sharp while the rest blur, and the focus steps through the
    phrase on a timer — pulling the eye word by word.
  </p>
  <DemoCard code={SNIPPETS.trueFocus}>
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <TrueFocus text="True focus mode" />
    </div>
  </DemoCard>
  <PropsTable rows={API.trueFocus} />
</section>

<!-- Circular text -->
<section id="circular-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Circular text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Text set around a full circle on an SVG path, rotating forever — a badge or
    seal. Uses <code class="text-foreground/80">currentColor</code> so it inherits type colour.
  </p>
  <DemoCard code={SNIPPETS.circularText}>
    <div class="flex min-h-48 items-center justify-center text-foreground">
      <CircularText text="DITHER · UI · TOOLKIT · " />
    </div>
  </DemoCard>
  <PropsTable rows={API.circularText} />
</section>

<!-- Curved loop -->
<section id="curved-loop" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Curved loop</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Text flows along a wavy SVG path as a seamless loop — the copy length is
    measured so the scroll wraps without a visible seam.
  </p>
  <DemoCard code={SNIPPETS.curvedLoop}>
    <div class="flex min-h-24 w-full items-center justify-center text-foreground">
      <CurvedLoop text="DITHER UI · CANVAS + BAYER · " />
    </div>
  </DemoCard>
  <PropsTable rows={API.curvedLoop} />
</section>

<!-- Fuzzy text -->
<section id="fuzzy-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Fuzzy text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    An SVG turbulence + displacement filter wobbles the glyph edges into an
    analog fuzz — native filters, no canvas. Reduced motion drops the filter.
  </p>
  <DemoCard code={SNIPPETS.fuzzyText}>
    <div class="flex min-h-24 items-center justify-center text-5xl font-bold tracking-tight">
      <FuzzyText text="FUZZY" />
    </div>
  </DemoCard>
  <PropsTable rows={API.fuzzyText} />
</section>

<!-- ASCII text -->
<section id="ascii-text" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">ASCII text</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The word is rasterised to an offscreen canvas and mapped onto an ASCII
    density ramp — an on-brand ASCII render of any string.
  </p>
  <DemoCard code={SNIPPETS.asciiText}>
    <div class="flex min-h-24 items-center justify-center text-foreground">
      <AsciiText text="DITHER" />
    </div>
  </DemoCard>
  <PropsTable rows={API.asciiText} />
</section>
