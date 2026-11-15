import { assetPath } from "@/shared/lib"
import { ICON_NAMES } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { exampleCode } from "../example-code"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import boxProps from "virtual:dither-props/DitherBox"
import textProps from "virtual:dither-props/DitherText"
import dividerProps from "virtual:dither-props/DitherDivider"
import visuallyHiddenProps from "virtual:dither-props/DitherVisuallyHidden"
import iconProps from "virtual:dither-props/DitherIcon"
import iconSetProps from "virtual:dither-props/DitherIconSet"
import svgProps from "virtual:dither-props/DitherSvg"
import imgProps from "virtual:dither-props/DitherImg"
import spacerProps from "virtual:dither-props/DitherSpacer"
import portalProps from "virtual:dither-props/DitherPortal"
import overlayProps from "virtual:dither-props/DitherOverlay"
import measureProps from "virtual:dither-props/DitherMeasure"
import clipboardProps from "virtual:dither-props/DitherClipboard"
import clickOutsideProps from "virtual:dither-props/DitherClickOutside"
import focusScopeProps from "virtual:dither-props/DitherFocusScope"
import hoverAreaProps from "virtual:dither-props/DitherHoverArea"
import pressableProps from "virtual:dither-props/DitherPressable"
import inViewProps from "virtual:dither-props/DitherInView"
import focusRingProps from "virtual:dither-props/DitherFocusRing"
import DocSection from "../DocSection"
import TextExample from "./examples/text"
import textCode from "./examples/text.tsx?raw"
import BoxExample from "./examples/box"
import boxCode from "./examples/box.tsx?raw"
import DividerExample from "./examples/divider"
import dividerCode from "./examples/divider.tsx?raw"
import VisuallyHiddenExample from "./examples/visually-hidden"
import visuallyHiddenCode from "./examples/visually-hidden.tsx?raw"
import SvgExample from "./examples/svg"
import svgCode from "./examples/svg.tsx?raw"
import ImgExample from "./examples/img"
import imgCode from "./examples/img.tsx?raw"
import SpacerExample from "./examples/spacer"
import spacerCode from "./examples/spacer.tsx?raw"
import PortalExample from "./examples/portal"
import portalCode from "./examples/portal.tsx?raw"
import OverlayExample from "./examples/overlay"
import overlayCode from "./examples/overlay.tsx?raw"
import MeasureExample from "./examples/measure"
import measureCode from "./examples/measure.tsx?raw"
import ClipboardExample from "./examples/clipboard"
import clipboardCode from "./examples/clipboard.tsx?raw"
import ClickOutsideExample from "./examples/click-outside"
import clickOutsideCode from "./examples/click-outside.tsx?raw"
import FocusRingExample from "./examples/focus-ring"
import focusRingCode from "./examples/focus-ring.tsx?raw"
import FocusScopeExample from "./examples/focus-scope"
import focusScopeCode from "./examples/focus-scope.tsx?raw"
import HoverAreaExample from "./examples/hover-area"
import hoverAreaCode from "./examples/hover-area.tsx?raw"
import PressableExample from "./examples/pressable"
import pressableCode from "./examples/pressable.tsx?raw"
import InViewExample from "./examples/in-view"
import inViewCode from "./examples/in-view.tsx?raw"
import IconExample from "./examples/icon"
import iconCode from "./examples/icon.tsx?raw"
import IconSetExample from "./examples/icon-set"
import iconSetCode from "./examples/icon-set.tsx?raw"

export const API: Record<string, PropRow[]> = {
  box: kitTable(boxProps),
  text: kitTable(textProps),
  divider: kitTable(dividerProps),
  visuallyHidden: kitTable(visuallyHiddenProps),
  icon: kitTable(iconProps),
  iconSet: kitTable(iconSetProps, {
    // how a sprite of the set is drawn
    add: { rows: [{ prop: "use", type: 'via <use href="#di-icon-Name">', default: "" }] },
  }),
  svg: kitTable(svgProps),
  img: kitTable(imgProps),
  spacer: kitTable(spacerProps),
  portal: kitTable(portalProps),
  overlay: kitTable(overlayProps),
  measure: kitTable(measureProps),
  clipboard: kitTable(clipboardProps),
  clickOutside: kitTable(clickOutsideProps),
  focusRing: kitTable(focusRingProps),
  focusScope: kitTable(focusScopeProps),
  hoverArea: kitTable(hoverAreaProps),
  pressable: kitTable(pressableProps),
  inView: kitTable(inViewProps),
}

export default function PrimitivesDocs() {
  return (
    <>
      {/* Box */}
      <DocSection id="box">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One element, one job: a typed container whose whole style arrives as{" "}
          <code class="text-foreground/80">class</code>. Swap the tag with <code class="text-foreground/80">as</code>{" "}
          (landmarks for structure, spans for inline flow) and its children never notice.
        </p>
        <DemoCard code={boxCode}>
          <BoxExample />
        </DemoCard>
        <PropsTable rows={API.box} />
      </DocSection>
      {/* Text */}
      <DocSection id="text">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The type scale the whole site speaks: three token tones, four sizes from 11 to 15px, and{" "}
          <code class="text-foreground/80">as</code> for the element. Leading, tracking and weight stay yours in{" "}
          <code class="text-foreground/80">class</code>.
        </p>
        <DemoCard code={textCode}>
          <div class="grid gap-3 text-left">
            <TextExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.text} />
      </DocSection>
      {/* Divider */}
      <DocSection id="divider">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A hairline rule with real separator semantics. Horizontal renders an{" "}
          <code class="text-foreground/80">hr</code>; vertical lives in flex rows and stretches to their height. Both
          announce their orientation.
        </p>
        <DemoCard code={dividerCode}>
          <DividerExample />
        </DemoCard>
        <PropsTable rows={API.divider} />
      </DocSection>
      {/* VisuallyHidden */}
      <DocSection id="visually-hidden">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Content for screen readers only: labels that must exist in the reading order without painting anything. Flip
          on <code class="text-foreground/80">focusable</code> for the skip-link pattern: Tab reveals it, styled as a
          chip over the page.
        </p>
        <DemoCard code={visuallyHiddenCode}>
          <VisuallyHiddenExample />
        </DemoCard>
        <PropsTable rows={API.visuallyHidden} />
      </DocSection>
      {/* Svg */}
      <DocSection id="svg">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A neutral SVG shell: no imposed stroke language, so the kit's art direction stays inside the components.
          Decorative by default (<code class="text-foreground/80">aria-hidden</code>); a{" "}
          <code class="text-foreground/80">label</code> promotes it to{" "}
          <code class="text-foreground/80">role="img"</code> with a name.
        </p>
        <DemoCard code={svgCode}>
          <SvgExample />
        </DemoCard>
        <PropsTable rows={API.svg} />
      </DocSection>
      {/* Image */}
      <DocSection id="img">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The plain <code class="text-foreground/80">img</code> with the modern loading contract baked in: lazy, async
          decode, and a required <code class="text-foreground/80">alt</code> (empty string is the explicit decorative
          choice). For the ordered-dither renderer see{" "}
          <a
            class="text-foreground/80 underline decoration-border underline-offset-4 hover:decoration-foreground/60"
            href="#image"
          >
            Image
          </a>{" "}
          in Components.
        </p>
        <DemoCard code={exampleCode(imgCode)}>
          {/* the demo asks for the sheet under the site's base path; the code, at the root */}
          <ImgExample src={assetPath("/sprites.webp")} />
        </DemoCard>
        <PropsTable rows={API.img} />
      </DocSection>
      {/* Spacer */}
      <DocSection id="spacer">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sized empty space for flex and grid rows, the alternative to magic margins. Two axes, five steps from 4 to
          40px, always decorative.
        </p>
        <DemoCard code={spacerCode}>
          <SpacerExample />
        </DemoCard>
        <PropsTable rows={API.spacer} />
      </DocSection>
      {/* Portal */}
      <DocSection id="portal">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Portal by name: render children elsewhere in the DOM so popovers and toasts escape{" "}
          <code class="text-foreground/80">overflow: hidden</code>. <code class="text-foreground/80">disabled</code>{" "}
          keeps it in place (the switch for tests and environments where the target does not exist);{" "}
          <code class="text-foreground/80">defer</code> waits for the rest of the render, so the target can come later
          in the same markup, as it does here.
        </p>
        <DemoCard code={portalCode}>
          <PortalExample />
        </DemoCard>
        <PropsTable rows={API.portal} />
      </DocSection>
      {/* Overlay */}
      <DocSection id="overlay">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A full-cover layer in four dim weights. Decorative and click-transparent by default;{" "}
          <code class="text-foreground/80">interactive</code> makes it catch presses (dismissible scrims) and lifts the
          aria-hidden so its children stay reachable.
        </p>
        <DemoCard code={overlayCode}>
          <OverlayExample />
        </DemoCard>
        <PropsTable rows={API.overlay} />
      </DocSection>
      {/* Measure */}
      <DocSection id="measure">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Reports its own box: a plain block that calls <code class="text-foreground/80">onResize</code> with width and
          height on every change. ResizeObserver only: without it the children still render and it simply stays silent.
        </p>
        <DemoCard code={measureCode}>
          <MeasureExample />
        </DemoCard>
        <PropsTable rows={API.measure} />
      </DocSection>
      {/* Clipboard */}
      <DocSection id="clipboard">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Clipboard behavior around any trigger: the function child gets <code class="text-foreground/80">copied</code>{" "}
          and <code class="text-foreground/80">copy</code>, and a polite live region announces the result. Your trigger
          keeps its own semantics. This adds the behavior and the announcement.
        </p>
        <DemoCard code={clipboardCode}>
          <ClipboardExample />
        </DemoCard>
        <PropsTable rows={API.clipboard} />
      </DocSection>
      {/* ClickOutside */}
      <DocSection id="click-outside">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One <code class="text-foreground/80">outside</code> event when a primary press lands anywhere beyond the
          wrapped content: capture-phase <code class="text-foreground/80">pointerdown</code>, so nested scroll
          containers and shadowed children are handled by containment, not by guessing.
        </p>
        <DemoCard code={clickOutsideCode}>
          <ClickOutsideExample />
        </DemoCard>
        <PropsTable rows={API.clickOutside} />
      </DocSection>
      {/* FocusRing */}
      <DocSection id="focus-ring">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Container-level focus: wraps a control group and rings while anything inside holds focus, so keyboard users
          see which group is active. The individual control keeps the global{" "}
          <code class="text-foreground/80">:focus-visible</code> floor.
        </p>
        <DemoCard code={focusRingCode}>
          <FocusRingExample />
        </DemoCard>
        <PropsTable rows={API.focusRing} />
      </DocSection>
      {/* FocusScope */}
      <DocSection id="focus-scope">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The modal focus contract in one component: focus enters on mount, <code class="text-foreground/80">Tab</code>{" "}
          cycles inside the scope, and closing hands focus back to whatever had it. Every dialog in the kit obeys
          exactly these three rules.
        </p>
        <DemoCard code={focusScopeCode}>
          <FocusScopeExample />
        </DemoCard>
        <PropsTable rows={API.focusScope} />
      </DocSection>
      {/* HoverArea */}
      <DocSection id="hover-area">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Hover state as function-child data: no refs, no listener bookkeeping. Keyboard focus tracks alongside the
          pointer so the reveal is the same for everyone.
        </p>
        <DemoCard code={hoverAreaCode}>
          <HoverAreaExample />
        </DemoCard>
        <PropsTable rows={API.hoverArea} />
      </DocSection>
      {/* Pressable */}
      <DocSection id="pressable">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A native button (never submits a form by accident) with the house press affordance and the theme's focus ring
          that looks like a button out of the box: solid ink by default, outline or ghost beside it, and plain for the
          bare base when you draw every pixel yourself. For the dithered, blooming version see{" "}
          <a
            class="text-foreground/80 underline decoration-border underline-offset-4 hover:decoration-foreground/60"
            href="#button"
          >
            DitherButton
          </a>
          .
        </p>
        <DemoCard code={pressableCode}>
          <PressableExample />
        </DemoCard>
        <PropsTable rows={API.pressable} />
      </DocSection>
      {/* InView */}
      <DocSection id="in-view">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The taxonomy's IntersectionObserver primitive, named for what it does: visibility as function-child state.{" "}
          <code class="text-foreground/80">once</code> latches after the first enter (the lazy-reveal shape this whole
          page runs on). Degraded engines see content, never an empty box.
        </p>
        <DemoCard code={inViewCode}>
          <InViewExample />
        </DemoCard>
        <PropsTable rows={API.inView} />
      </DocSection>
      {/* Icon */}
      <DocSection
        id="icon"
        head={(heading) => (
          <div class="flex items-baseline justify-between gap-4">
            {heading}
            <span class="text-[11px] tabular-nums text-muted-foreground">{ICON_NAMES.length} glyphs</span>
          </div>
        )}
      >
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The hand-rolled set: 24×24 stroke geometry, currentColor, round caps. One source in{" "}
          <code class="text-foreground/80">icons.ts</code>, no dependencies. Decorative by default; a{" "}
          <code class="text-foreground/80">label</code> names it for screen readers. Unknown names throw instead of
          rendering an empty box.
        </p>
        <DemoCard code={iconCode}>
          <IconExample />
        </DemoCard>
        <PropsTable rows={API.icon} />
      </DocSection>
      {/* IconSet */}
      <DocSection id="icon-set">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The same set as <code class="text-foreground/80">&lt;symbol&gt;</code> sheets: mount once and reference glyphs
          with <code class="text-foreground/80">&lt;use href="#di-icon-Name"&gt;</code> when a screen repeats icons
          enough to care. Opt-in: <code class="text-foreground/80">DitherIcon</code> never needs it.
        </p>
        <DemoCard code={iconSetCode}>
          <IconSetExample />
        </DemoCard>
        <PropsTable rows={API.iconSet} />
      </DocSection>
    </>
  )
}
