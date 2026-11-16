import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import gradientTextProps from "virtual:dither-props/DitherGradientText"
import shinyTextProps from "virtual:dither-props/DitherShinyText"
import glitchTextProps from "virtual:dither-props/DitherGlitchText"
import splitTextProps from "virtual:dither-props/DitherSplitText"
import rotatingTextProps from "virtual:dither-props/DitherRotatingText"
import countUpProps from "virtual:dither-props/DitherCountUp"
import numberFlowProps from "virtual:dither-props/DitherNumberFlow"
import textTypeProps from "virtual:dither-props/DitherTextType"
import blurTextProps from "virtual:dither-props/DitherBlurText"
import decryptedTextProps from "virtual:dither-props/DitherDecryptedText"
import scrambleTextProps from "virtual:dither-props/DitherScrambleText"
import shuffleProps from "virtual:dither-props/DitherShuffle"
import fallingTextProps from "virtual:dither-props/DitherFallingText"
import scrollRevealProps from "virtual:dither-props/DitherScrollReveal"
import scrollFloatProps from "virtual:dither-props/DitherScrollFloat"
import scrollVelocityProps from "virtual:dither-props/DitherScrollVelocity"
import textCursorProps from "virtual:dither-props/DitherTextCursor"
import textPressureProps from "virtual:dither-props/DitherTextPressure"
import variableProximityProps from "virtual:dither-props/DitherVariableProximity"
import trueFocusProps from "virtual:dither-props/DitherTrueFocus"
import circularTextProps from "virtual:dither-props/DitherCircularText"
import curvedLoopProps from "virtual:dither-props/DitherCurvedLoop"
import fuzzyTextProps from "virtual:dither-props/DitherFuzzyText"
import asciiTextProps from "virtual:dither-props/DitherAsciiText"
import DocSection from "../DocSection"
import GradientTextExample from "./examples/gradient-text"
import gradientTextCode from "./examples/gradient-text.tsx?raw"
import ShinyTextExample from "./examples/shiny-text"
import shinyTextCode from "./examples/shiny-text.tsx?raw"
import GlitchTextExample from "./examples/glitch-text"
import glitchTextCode from "./examples/glitch-text.tsx?raw"
import TextTypeExample from "./examples/text-type"
import textTypeCode from "./examples/text-type.tsx?raw"
import BlurTextExample from "./examples/blur-text"
import blurTextCode from "./examples/blur-text.tsx?raw"
import DecryptedTextExample from "./examples/decrypted-text"
import decryptedTextCode from "./examples/decrypted-text.tsx?raw"
import ScrambleTextExample from "./examples/scramble-text"
import scrambleTextCode from "./examples/scramble-text.tsx?raw"
import ScrollRevealExample from "./examples/scroll-reveal"
import scrollRevealCode from "./examples/scroll-reveal.tsx?raw"
import ScrollFloatExample from "./examples/scroll-float"
import scrollFloatCode from "./examples/scroll-float.tsx?raw"
import ScrollVelocityExample from "./examples/scroll-velocity"
import scrollVelocityCode from "./examples/scroll-velocity.tsx?raw"
import TextPressureExample from "./examples/text-pressure"
import textPressureCode from "./examples/text-pressure.tsx?raw"
import TrueFocusExample from "./examples/true-focus"
import trueFocusCode from "./examples/true-focus.tsx?raw"
import CircularTextExample from "./examples/circular-text"
import circularTextCode from "./examples/circular-text.tsx?raw"
import CurvedLoopExample from "./examples/curved-loop"
import curvedLoopCode from "./examples/curved-loop.tsx?raw"
import FuzzyTextExample from "./examples/fuzzy-text"
import fuzzyTextCode from "./examples/fuzzy-text.tsx?raw"
import AsciiTextExample from "./examples/ascii-text"
import asciiTextCode from "./examples/ascii-text.tsx?raw"
import SplitTextExample from "./examples/split-text"
import splitTextCode from "./examples/split-text.tsx?raw"
import RotatingTextExample from "./examples/rotating-text"
import rotatingTextCode from "./examples/rotating-text.tsx?raw"
import CountUpExample from "./examples/count-up"
import countUpCode from "./examples/count-up.tsx?raw"
import NumberFlowExample from "./examples/number-flow"
import numberFlowCode from "./examples/number-flow.tsx?raw"
import ShuffleExample from "./examples/shuffle"
import shuffleCode from "./examples/shuffle.tsx?raw"
import FallingTextExample from "./examples/falling-text"
import fallingTextCode from "./examples/falling-text.tsx?raw"
import TextCursorExample from "./examples/text-cursor"
import textCursorCode from "./examples/text-cursor.tsx?raw"
import VariableProximityExample from "./examples/variable-proximity"
import variableProximityCode from "./examples/variable-proximity.tsx?raw"

export const API: Record<string, PropRow[]> = {
  gradientText: kitTable(gradientTextProps),
  shinyText: kitTable(shinyTextProps),
  glitchText: kitTable(glitchTextProps),
  splitText: kitTable(splitTextProps),
  rotatingText: kitTable(rotatingTextProps),
  countUp: kitTable(countUpProps),
  numberFlow: kitTable(numberFlowProps),
  textType: kitTable(textTypeProps),
  blurText: kitTable(blurTextProps),
  decryptedText: kitTable(decryptedTextProps),
  scrambleText: kitTable(scrambleTextProps),
  shuffle: kitTable(shuffleProps),
  fallingText: kitTable(fallingTextProps),
  scrollReveal: kitTable(scrollRevealProps),
  scrollFloat: kitTable(scrollFloatProps),
  scrollVelocity: kitTable(scrollVelocityProps),
  textCursor: kitTable(textCursorProps),
  textPressure: kitTable(textPressureProps),
  variableProximity: kitTable(variableProximityProps),
  trueFocus: kitTable(trueFocusProps),
  circularText: kitTable(circularTextProps),
  curvedLoop: kitTable(curvedLoopProps),
  fuzzyText: kitTable(fuzzyTextProps),
  asciiText: kitTable(asciiTextProps),
}

export default function TextDocs() {
  return (
    <>
      {/* Gradient text */}
      <DocSection id="gradient-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An animated gradient clipped to the text. The colour band drifts across the glyphs forever. Respects reduced
          motion.
        </p>
        <DemoCard code={gradientTextCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
            <GradientTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.gradientText} />
      </DocSection>
      {/* Shiny text */}
      <DocSection id="shiny-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A bright highlight sweeps across dim text on a loop: a subtle sheen for headlines and labels.
        </p>
        <DemoCard code={shinyTextCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
            <ShinyTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.shinyText} />
      </DocSection>
      {/* Glitch text */}
      <DocSection id="glitch-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Two RGB-split copies jitter and clip over the base text for a broken-signal effect. The base stays readable;
          the glitch layers hide under reduced motion.
        </p>
        <DemoCard code={glitchTextCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl font-medium tracking-tight">
            <GlitchTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.glitchText} />
      </DocSection>
      {/* Split text */}
      <DocSection id="split-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Each character rises and settles on a stagger. Bump <code class="text-foreground/80">replayToken</code> to run
          it again; the whole word is still one labelled node for screen readers.
        </p>
        <DemoCard code={splitTextCode}>
          <SplitTextExample />
        </DemoCard>
        <PropsTable rows={API.splitText} />
      </DocSection>
      {/* Rotating text */}
      <DocSection id="rotating-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Cycles through a list of words for a headline that says several things, each sliding out as the next slides
          in.
        </p>
        <DemoCard code={rotatingTextCode}>
          <RotatingTextExample />
        </DemoCard>
        <PropsTable rows={API.rotatingText} />
      </DocSection>
      {/* Count up */}
      <DocSection id="count-up">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Eases a number from <code class="text-foreground/80">from</code> to <code class="text-foreground/80">to</code>{" "}
          when it scrolls into view. Locale-formatted, tabular figures. Reduced motion jumps to the final value.
        </p>
        <DemoCard code={countUpCode}>
          <CountUpExample />
        </DemoCard>
        <PropsTable rows={API.countUp} />
      </DocSection>
      <DocSection id="number-flow">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An odometer for live values: every digit rides a 0-9 column that rolls to the new figure whenever{" "}
          <code class="text-foreground/80">value</code> changes. Count up plays once; this one never stops. Reduced
          motion snaps.
        </p>
        <DemoCard code={numberFlowCode}>
          <NumberFlowExample />
        </DemoCard>
        <PropsTable rows={API.numberFlow} />
      </DocSection>
      {/* Text type */}
      <DocSection id="text-type">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A typewriter with a blinking caret: it types each string, pauses, deletes and moves to the next. Reduced
          motion shows the first line, no typing.
        </p>
        <DemoCard code={textTypeCode}>
          <div class="flex min-h-24 items-center justify-center text-2xl tracking-tight">
            <TextTypeExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.textType} />
      </DocSection>
      {/* Blur text */}
      <DocSection id="blur-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Words (or characters) blur into focus on a stagger the first time they enter the viewport. Still one labelled
          node for screen readers.
        </p>
        <DemoCard code={blurTextCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
            <BlurTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.blurText} />
      </DocSection>
      {/* Decrypted text */}
      <DocSection id="decrypted-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Scrambled cipher characters resolve left-to-right into the real text when it scrolls into view. Monospace
          keeps the width steady.
        </p>
        <DemoCard code={decryptedTextCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl font-medium tracking-tight">
            <DecryptedTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.decryptedText} />
      </DocSection>
      {/* Scramble text */}
      <DocSection id="scramble-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Hover to burst-scramble the characters, which then settle back to the real text. Repeatable on every hover.
        </p>
        <DemoCard code={scrambleTextCode}>
          <div class="flex min-h-24 items-center justify-center text-2xl tracking-tight sm:text-3xl">
            <ScrambleTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.scrambleText} />
      </DocSection>
      {/* Shuffle */}
      <DocSection id="shuffle">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Characters fly in from scattered offsets and rotations, settling into place on a stagger. Bump{" "}
          <code class="text-foreground/80">replayToken</code> to run it again.
        </p>
        <DemoCard code={shuffleCode}>
          <ShuffleExample />
        </DemoCard>
        <PropsTable rows={API.shuffle} />
      </DocSection>
      {/* Falling text */}
      <DocSection id="falling-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Characters drop in from above with a little overshoot bounce, staggered across the line.
        </p>
        <DemoCard code={fallingTextCode}>
          <FallingTextExample />
        </DemoCard>
        <PropsTable rows={API.fallingText} />
      </DocSection>
      {/* Scroll reveal */}
      <DocSection id="scroll-reveal">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The words fade and de-blur word-by-word as the block travels up through the viewport. The reveal is tied to
          scroll position, not a one-shot. Scroll the page.
        </p>
        <DemoCard code={scrollRevealCode}>
          <div class="flex min-h-24 max-w-md items-center justify-center text-center text-xl leading-relaxed tracking-tight">
            <ScrollRevealExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.scrollReveal} />
      </DocSection>
      {/* Scroll float */}
      <DocSection id="scroll-float">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Characters float up from an offset as the scroll progress reaches each one: a gentle parallax settle. Scroll
          the page.
        </p>
        <DemoCard code={scrollFloatCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
            <ScrollFloatExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.scrollFloat} />
      </DocSection>
      {/* Scroll velocity */}
      <DocSection id="scroll-velocity">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A seamless marquee band that drifts on its own and speeds up (or reverses) with your scroll velocity, easing
          back to base speed. Scroll the page.
        </p>
        <DemoCard code={scrollVelocityCode}>
          <div class="w-full text-2xl font-medium tracking-tight text-muted-foreground">
            <ScrollVelocityExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.scrollVelocity} />
      </DocSection>
      {/* Text cursor */}
      <DocSection id="text-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The characters of the word trail the pointer inside the box, each lagging a little further behind for a ribbon
          of type. Move your cursor over the preview.
        </p>
        <DemoCard code={textCursorCode}>
          <TextCursorExample />
        </DemoCard>
        <PropsTable rows={API.textCursor} />
      </DocSection>
      {/* Text pressure */}
      <DocSection id="text-pressure">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Characters bulge (scaling up and gaining weight) near the cursor, like the word is being pressed. Move your
          cursor near the text.
        </p>
        <DemoCard code={textPressureCode}>
          <div class="flex min-h-24 items-center justify-center text-4xl tracking-tight">
            <TextPressureExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.textPressure} />
      </DocSection>
      {/* Variable proximity */}
      <DocSection id="variable-proximity">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Each character's weight and opacity ramps with its distance to the pointer. No scaling, so a whole sentence
          stays put while the cursor lights a path through it.
        </p>
        <DemoCard code={variableProximityCode}>
          <VariableProximityExample />
        </DemoCard>
        <PropsTable rows={API.variableProximity} />
      </DocSection>
      {/* True focus */}
      <DocSection id="true-focus">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One word stays sharp while the rest blur, and the focus steps through the phrase on a timer, pulling the eye
          word by word.
        </p>
        <DemoCard code={trueFocusCode}>
          <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
            <TrueFocusExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.trueFocus} />
      </DocSection>
      {/* Circular text */}
      <DocSection id="circular-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Text set around a full circle on an SVG path, rotating forever: a badge or seal. Uses{" "}
          <code class="text-foreground/80">currentColor</code> so it inherits type colour.
        </p>
        <DemoCard code={circularTextCode}>
          <div class="flex min-h-48 items-center justify-center text-foreground">
            <CircularTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.circularText} />
      </DocSection>
      {/* Curved loop */}
      <DocSection id="curved-loop">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Text flows along a wavy SVG path as a seamless loop. The copy length is measured so the scroll wraps without a
          visible seam.
        </p>
        <DemoCard code={curvedLoopCode}>
          <div class="flex min-h-24 w-full items-center justify-center text-foreground">
            <CurvedLoopExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.curvedLoop} />
      </DocSection>
      {/* Fuzzy text */}
      <DocSection id="fuzzy-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An SVG turbulence + displacement filter wobbles the glyph edges into an analog fuzz. Native filters, no
          canvas. Reduced motion drops the filter.
        </p>
        <DemoCard code={fuzzyTextCode}>
          <div class="flex min-h-24 items-center justify-center text-5xl font-bold tracking-tight">
            <FuzzyTextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.fuzzyText} />
      </DocSection>
      {/* ASCII text */}
      <DocSection id="ascii-text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The word is rasterised to an offscreen canvas and mapped onto an ASCII density ramp: an on-brand ASCII render
          of any string.
        </p>
        <DemoCard code={asciiTextCode}>
          {/* Centred while it fits; on the narrowest phones it scrolls. */}
          <div class="flex min-h-24 items-center overflow-x-auto text-foreground">
            <div class="mx-auto w-max">
              <AsciiTextExample />
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.asciiText} />
      </DocSection>
    </>
  )
}
