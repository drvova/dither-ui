import { createSignal, For, Show } from "solid-js"
import {
  DitherBox,
  DitherClipboard,
  DitherClickOutside,
  DitherDivider,
  DitherFocusRing,
  DitherFocusScope,
  DitherHoverArea,
  DitherImg,
  DitherInView,
  DitherMeasure,
  DitherOverlay,
  DitherPortal,
  DitherPressable,
  DitherSpacer,
  DitherSvg,
  DitherText,
  DitherVisuallyHidden,
} from "@dither-ui/kit"
import { assetPath } from "@/shared/lib"
import { DitherIcon, DitherIconSet } from "@dither-ui/kit"
import { ICON_NAMES } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"
import DocSection from "../DocSection"

const SNIPPET_BOX = `<DitherBox as="section" class="rounded-lg border border-border/60 bg-card/40 p-5">
  <span class="text-[13px]">Content lands in a typed container.</span>
</DitherBox>`

const SNIPPET_TEXT = `<DitherText tone="muted" size="sm">Default paragraph tone.</DitherText>
<DitherText as="span" tone="faint" size="xs">Caption-weight aside.</DitherText>
<DitherText as="h3" size="lg">A heading in the native scale.</DitherText>`

const SNIPPET_DIVIDER = `<p>Charts render on canvas.</p>
<DitherDivider class="my-4" />
<p>Fills threshold the same Bayer matrix.</p>

{/* vertical: stretches inside a flex row */}
<div class="flex h-10 items-center gap-4">
  <span class="text-[12px]">Left</span>
  <DitherDivider orientation="vertical" />
  <span class="text-[12px]">Right</span>
</div>`

const SNIPPET_HIDDEN = `<p>
  Extra context that only a screen reader should read
  <DitherVisuallyHidden>(this sentence is announced, not painted)</DitherVisuallyHidden>
</p>

{/* focusable: the skip-link pattern, Tab reveals it */}
<DitherVisuallyHidden focusable>Skip to content</DitherVisuallyHidden>`

const SNIPPET_SVG = `{/* decorative by default: aria-hidden */}
<DitherSvg viewBox="0 0 24 24" class="size-5">
  <path d="M4 12h16M12 4v16" stroke="currentColor" stroke-width="2" />
</DitherSvg>

{/* labeled: promoted to role=img with a name */}
<DitherSvg viewBox="0 0 24 24" label="Plus" class="size-8">
  <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.5" />
</DitherSvg>`

const SNIPPET_IMG = `{/* loading contract built in; alt is required */}
<DitherImg src="/sprites.webp" alt="The sprite sheet" class="h-40 w-full object-cover" />`

const SNIPPET_SPACER = `<div class="flex items-center">
  <span class="text-[12px]">Left</span>
  <DitherSpacer axis="x" size="lg" />
  <span class="text-[12px]">Right</span>
</div>`

const SNIPPET_PORTAL = `<div class="h-24 overflow-hidden rounded-md border p-4">
  Declared in here, a box with overflow: hidden.
  <DitherPortal to="#portal-demo-out" defer>
    <span class="rounded-md border px-3 py-1.5">teleported out</span>
  </DitherPortal>
</div>
<div id="portal-demo-out" class="grid h-24 place-items-center rounded-md border border-dashed" />

{/* keep it in place (SSR / tests) */}
<DitherPortal disabled>Inline.</DitherPortal>`

const SNIPPET_OVERLAY = `const [open, setOpen] = createSignal(true)

{/* an overlay covers the screen; absolute positioning keeps it to its box */}
<div class="relative isolate grid h-40 place-items-center overflow-hidden rounded-md border">
  <button type="button" onClick={() => setOpen(true)}>Dim this box</button>
  {/* decorative by default; interactive catches presses, so a press closes it */}
  <Show when={open()}><DitherOverlay dim="medium" interactive class="absolute" onClick={() => setOpen(false)} /></Show>
</div>`

const SNIPPET_MEASURE = `<DitherMeasure class="w-48" onResize={onResize}>
  <div class="h-20 rounded border" />
</DitherMeasure>

function onResize({ width, height }: { width: number; height: number }) {
  console.log(width, height)
}`

const SNIPPET_CLIPBOARD = `<DitherClipboard value="npm i d3-scale d3-shape clsx">
  {(scope) => (
    <>
      {/* scoped slot wraps the trigger: copied + copy land right here */}
      <button type="button" class="rounded border px-3 py-1.5 text-[11px]">
        {scope.copied ? "copied" : "copy install"}
      </button>
    </>
  )}
</DitherClipboard>`

const SNIPPET_CLICK_OUTSIDE = `const [open, setOpen] = createSignal(false)

<DitherClickOutside enabled={open()} onOutside={() => setOpen(false)}>
  <button type="button" onClick={() => setOpen(!open())}>{open() ? "menu open: click anywhere outside" : "open the menu"}</button>
  <Show when={open()}><div class="mt-2 rounded border p-2">Pressing outside closes this.</div></Show>
</DitherClickOutside>`

const SNIPPET_FOCUS_RING = `<DitherFocusRing class="inline-flex gap-2 p-1">
  <button type="button">First</button>
  <button type="button">Second</button>
</DitherFocusRing>`

const SNIPPET_FOCUS_SCOPE = `const [dialog, setDialog] = createSignal(false)

<button type="button" onClick={() => setDialog(!dialog())}>{dialog() ? "close (focus returns to me)" : "open a focus scope"}</button>
<Show when={dialog()}>
  <DitherFocusScope onKeydown={(e) => { if (e.key !== "Escape") return; setDialog(false) }}>
    <h2 tabindex="-1">Confirm</h2>
    <button type="button">Yes</button>
    <button type="button">No</button>
  </DitherFocusScope>
</Show>
{/* focus enters on open, Tab cycles inside, returns to the opener on close */}`

const SNIPPET_HOVER_AREA = `<DitherHoverArea>
  {(scope) => (
    <div class={\`rounded border p-4 \${scope.hovered || scope.focused ? 'border-foreground' : 'border-border/60'}\`}>
      Reveal on hover — or on keyboard focus.
    </div>
  )}
</DitherHoverArea>`

const SNIPPET_PRESSABLE = `<DitherPressable>Get started</DitherPressable>
<DitherPressable variant="outline">Compare plans</DitherPressable>
<DitherPressable variant="ghost">Later</DitherPressable>
<DitherPressable disabled>Sold out</DitherPressable>
<DitherPressable variant="plain" class="underline underline-offset-4">Bare base, your look</DitherPressable>`

const SNIPPET_IN_VIEW = `<DitherInView once={true}>
  {(scope) => (
    <div class={\`h-40 rounded border transition-opacity \${scope.inView ? 'opacity-100' : 'opacity-0'}\`}>
      Reveals its state when it approaches the viewport.
    </div>
  )}
</DitherInView>`

const SNIPPET_ICON = `{/* decorative by default */}
<DitherIcon name="Search" size={20} />

{/* labeled: promoted to role=img with a name */}
<DitherIcon name="Close" label="Dismiss" size={18} />

{/* currentColor inherits; weight rides on stroke-width */}
<DitherIcon name="Trash" size={24} strokeWidth={1.5} class="text-red-400" />`

const SNIPPET_ICON_SET = `{/* once, near the app root */}
<DitherIconSet />

{/* then anywhere: one symbol, many uses */}
<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
  <use href="#di-icon-Star" />
</svg>`

const API: Record<string, PropRow[]> = {
  box: [{ prop: "as", type: '"div" | "section" | "span" | "article" | …', default: '"div"' }],
  text: [
    { prop: "as", type: '"p" | "span" | "h3" | "li" | …', default: '"p"' },
    { prop: "tone", type: '"default" | "muted" | "faint"', default: '"default"' },
    { prop: "size", type: '"xs" | "sm" | "md" | "lg" (11–15px)', default: "" },
  ],
  divider: [{ prop: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' }],
  visuallyHidden: [{ prop: "focusable", type: "boolean", default: "false" }],
  icon: [
    { prop: "name", type: "IconName (glyph list in icons.ts)", default: "required" },
    { prop: "size", type: "number (px)", default: "16" },
    { prop: "label", type: "string (promotes to role=img)", default: "" },
    { prop: "strokeWidth", type: "number", default: "2" },
  ],
  iconSet: [{ prop: "use", type: 'via <use href="#di-icon-Name">', default: "" }],
  svg: [
    { prop: "viewBox", type: "string", default: "" },
    { prop: "label", type: "string (promotes to role=img)", default: "" },
  ],
  img: [
    { prop: "src", type: "string", default: "required" },
    { prop: "alt", type: "string (empty string = decorative)", default: "required" },
    { prop: "loading", type: '"lazy" | "eager"', default: '"lazy"' },
    { prop: "decoding", type: '"async" | "auto" | "sync"', default: '"async"' },
  ],
  spacer: [
    { prop: "axis", type: '"y" | "x"', default: '"y"' },
    { prop: "size", type: '"xs" | "sm" | "md" | "lg" | "xl" (4–40px)', default: '"md"' },
  ],
  portal: [
    { prop: "to", type: "string (selector)", default: '"body"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "defer", type: "boolean (the target may come later in the markup)", default: "false" },
  ],
  overlay: [
    { prop: "dim", type: '"none" | "soft" | "medium" | "strong"', default: '"soft"' },
    { prop: "interactive", type: "boolean", default: "false" },
  ],
  measure: [{ prop: "onResize", type: "({ width, height }) => void", default: "on box change" }],
  clipboard: [
    { prop: "value", type: "string", default: "required" },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "onCopied", type: "(value) => void", default: "on success" },
  ],
  clickOutside: [
    { prop: "enabled", type: "boolean", default: "true" },
    { prop: "onOutside", type: "(event) => void: pointerdown outside", default: "" },
  ],
  focusRing: [],
  focusScope: [
    { prop: "autofocus", type: "boolean", default: "true" },
    { prop: "trapped", type: "boolean", default: "true" },
    { prop: "restoreFocus", type: "boolean", default: "true" },
  ],
  hoverArea: [{ prop: "children", type: "({ hovered, focused }) => JSX.Element", default: "" }],
  pressable: [
    { prop: "variant", type: '"solid" | "outline" | "ghost" | "plain"', default: '"solid"' },
    { prop: "type", type: '"button" | "submit" | "reset"', default: '"button"' },
    { prop: "disabled", type: "boolean", default: "false" },
  ],
  inView: [
    { prop: "rootMargin", type: "string", default: '"200px"' },
    { prop: "threshold", type: "number", default: "0" },
    { prop: "once", type: "boolean", default: "true" },
    { prop: "children", type: "({ inView }) => JSX.Element", default: "" },
  ],
}

export default function PrimitivesDocs() {
  // Demo state for the interactive primitive sections.
  const [measured, setMeasured] = createSignal("not measured yet")
  const onMeasure = (size: { width: number; height: number }) => {
    setMeasured(size.width + " × " + size.height)
  }
  const [demoMenuOpen, setDemoMenuOpen] = createSignal(false)
  const [dimmed, setDimmed] = createSignal(true)
  const [scopeOpen, setScopeOpen] = createSignal(false)

  return (
    <>
      {/* Box */}
      <DocSection id="box">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One element, one job: a typed container whose whole style arrives as{" "}
          <code class="text-foreground/80">class</code>. Swap the tag with <code class="text-foreground/80">as</code>{" "}
          (landmarks for structure, spans for inline flow) and its children never notice.
        </p>
        <DemoCard code={SNIPPET_BOX}>
          <DitherBox class="rounded-lg border border-border/60 bg-card/40 p-5 text-center" as="section">
            <span class="text-[13px] text-foreground/90">Content lands in a typed container.</span>
          </DitherBox>
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
        <DemoCard code={SNIPPET_TEXT}>
          <div class="grid gap-3 text-left">
            <DitherText tone="muted" size="sm">
              Default paragraph tone.
            </DitherText>
            <DitherText as="span" tone="faint" size="xs">
              Caption-weight aside.
            </DitherText>
            <DitherText as="h3" size="lg">
              A heading in the native scale.
            </DitherText>
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
        <DemoCard code={SNIPPET_DIVIDER}>
          <div class="mx-auto w-full max-w-sm">
            <DitherText class="text-center" size="sm" tone="muted">
              Charts render on canvas.
            </DitherText>
            <DitherDivider class="my-4" />
            <DitherText class="text-center" size="sm" tone="muted">
              Fills threshold the same Bayer matrix.
            </DitherText>
            <div class="mt-6 flex h-10 items-center justify-center gap-4">
              <span class="text-[12px] text-foreground/90">Left</span>
              <DitherDivider orientation="vertical" />
              <span class="text-[12px] text-foreground/90">Right</span>
            </div>
          </div>
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
        <DemoCard code={SNIPPET_HIDDEN}>
          <div class="grid justify-items-center gap-3">
            <p class="text-[12px] text-muted-foreground">
              Extra context that only a screen reader should read{" "}
              <DitherVisuallyHidden>(this sentence is announced, not painted)</DitherVisuallyHidden>
            </p>
            <a
              class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              href="#box"
            >
              Tab to reveal the skip link
            </a>
            <DitherVisuallyHidden focusable>Skip to content</DitherVisuallyHidden>
          </div>
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
        <DemoCard code={SNIPPET_SVG}>
          <div class="flex items-center justify-center gap-6">
            <DitherSvg class="size-6 text-foreground/80" viewBox="0 0 24 24">
              <path d="M4 12h16M12 4v16" stroke="currentColor" stroke-width="2" />
            </DitherSvg>
            <DitherSvg class="size-8 text-foreground" viewBox="0 0 24 24" label="Plus">
              <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.5" />
            </DitherSvg>
          </div>
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
        <DemoCard code={SNIPPET_IMG}>
          <DitherImg
            class="h-40 w-full rounded-md object-cover"
            src={assetPath("/sprites.webp")}
            alt="The dither-ui sprite sheet"
          />
        </DemoCard>
        <PropsTable rows={API.img} />
      </DocSection>
      {/* Spacer */}
      <DocSection id="spacer">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sized empty space for flex and grid rows, the alternative to magic margins. Two axes, five steps from 4 to
          40px, always decorative.
        </p>
        <DemoCard code={SNIPPET_SPACER}>
          <div class="flex items-center justify-center rounded-md border border-border/60 p-4">
            <span class="text-[12px] text-foreground/90">Left</span>
            <DitherSpacer axis="x" size="lg" />
            <span class="text-[12px] text-foreground/90">Right</span>
            <DitherSpacer axis="x" size="xs" />
            <span class="text-[12px] text-muted-foreground">tight</span>
          </div>
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
        <DemoCard code={SNIPPET_PORTAL}>
          {/* The chip is declared inside a clipped box and lands in the target
           beside it: the escape, kept inside the demo's own well. */}
          <div class="grid gap-3 text-[12px] text-muted-foreground sm:grid-cols-2">
            <div class="h-24 overflow-hidden rounded-md border border-border/60 p-4">
              Declared in here, a box with <code class="text-foreground/80">overflow: hidden</code>.{" "}
              <DitherPortal to="#portal-demo-out" defer>
                <span class="rounded-md border border-border/60 bg-card px-3 py-1.5 text-[11px]">teleported out</span>
              </DitherPortal>
            </div>
            <div
              class="grid h-24 place-items-center rounded-md border border-dashed border-border/60 p-4"
              id="portal-demo-out"
            />
          </div>
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
        <DemoCard code={SNIPPET_OVERLAY}>
          <div class="relative isolate grid h-40 place-items-center overflow-hidden rounded-md border border-border/60 bg-card/40">
            <button
              class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              type="button"
              onClick={() => setDimmed(true)}
            >
              Dim this box
            </button>
            <Show when={dimmed()}>
              <DitherOverlay class="absolute" dim="medium" interactive onClick={() => setDimmed(false)} />
            </Show>
          </div>
        </DemoCard>
        <PropsTable rows={API.overlay} />
      </DocSection>
      {/* Measure */}
      <DocSection id="measure">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Reports its own box: a plain block that calls <code class="text-foreground/80">onResize</code> with width and
          height on every change. ResizeObserver only: without it the children still render and it simply stays silent.
        </p>
        <DemoCard code={SNIPPET_MEASURE}>
          <div class="grid justify-items-center gap-3">
            <DitherMeasure class="w-48" onResize={onMeasure}>
              <div class="h-20 w-full rounded-md border border-border/60 bg-card/40" />
            </DitherMeasure>
            <span class="text-[11px] tabular-nums text-muted-foreground">{measured()}</span>
          </div>
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
        <DemoCard code={SNIPPET_CLIPBOARD}>
          <div class="flex justify-center">
            <DitherClipboard value="npm i d3-scale d3-shape clsx">
              {(scope) => (
                <button
                  class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  type="button"
                >
                  {scope.copied ? "copied ✓" : "copy install command"}
                </button>
              )}
            </DitherClipboard>
          </div>
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
        <DemoCard code={SNIPPET_CLICK_OUTSIDE}>
          <div class="flex justify-center">
            <DitherClickOutside enabled={demoMenuOpen()} onOutside={() => setDemoMenuOpen(false)}>
              <div class="grid gap-2">
                <button
                  class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  type="button"
                  onClick={() => setDemoMenuOpen(!demoMenuOpen())}
                >
                  {demoMenuOpen() ? "menu open: click anywhere outside" : "open the menu"}
                </button>
                <Show when={demoMenuOpen()}>
                  <div class="rounded-md border border-border/60 bg-card p-2 text-[11px] text-muted-foreground">
                    Pressing outside closes this.
                  </div>
                </Show>
              </div>
            </DitherClickOutside>
          </div>
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
        <DemoCard code={SNIPPET_FOCUS_RING}>
          <div class="flex justify-center">
            <DitherFocusRing class="inline-flex gap-2 rounded-md p-1">
              <button
                class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground"
                type="button"
              >
                First
              </button>
              <button
                class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground"
                type="button"
              >
                Second
              </button>
            </DitherFocusRing>
          </div>
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
        <DemoCard code={SNIPPET_FOCUS_SCOPE}>
          <div class="grid justify-items-center gap-3">
            <button
              class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              type="button"
              onClick={() => setScopeOpen(!scopeOpen())}
            >
              {scopeOpen() ? "close (focus returns to me)" : "open a focus scope"}
            </button>
            <Show when={scopeOpen()}>
              <DitherFocusScope class="grid gap-2 rounded-md border border-border/60 bg-card p-4 text-center">
                <h3 class="text-[12px] text-foreground" tabindex="-1">
                  Scope active
                </h3>
                <div class="flex justify-center gap-2">
                  <button class="rounded border border-border/60 px-3 py-1 text-[11px]" type="button">
                    Yes
                  </button>
                  <button class="rounded border border-border/60 px-3 py-1 text-[11px]" type="button">
                    No
                  </button>
                </div>
                <span class="text-[10px] text-muted-foreground">Tab cycles here, nowhere else</span>
              </DitherFocusScope>
            </Show>
          </div>
        </DemoCard>
        <PropsTable rows={API.focusScope} />
      </DocSection>
      {/* HoverArea */}
      <DocSection id="hover-area">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Hover state as function-child data: no refs, no listener bookkeeping. Keyboard focus tracks alongside the
          pointer so the reveal is the same for everyone.
        </p>
        <DemoCard code={SNIPPET_HOVER_AREA}>
          <DitherHoverArea class="mx-auto max-w-sm">
            {(scope) => (
              <div
                class={`rounded-md border p-4 text-center text-[12px] transition-colors ${scope.hovered || scope.focused ? "border-foreground text-foreground" : "border-border/60 text-muted-foreground"}`}
              >
                {scope.hovered || scope.focused ? "revealed" : "hover or tab onto this"}
              </div>
            )}
          </DitherHoverArea>
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
        <DemoCard code={SNIPPET_PRESSABLE}>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <DitherPressable>Get started</DitherPressable>
            <DitherPressable variant="outline">Compare plans</DitherPressable>
            <DitherPressable variant="ghost">Later</DitherPressable>
            <DitherPressable disabled>Sold out</DitherPressable>
            <DitherPressable class="text-[12px] underline underline-offset-4" variant="plain">
              Bare base, your look
            </DitherPressable>
          </div>
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
        <DemoCard code={SNIPPET_IN_VIEW}>
          <DitherInView class="grid h-40 place-items-center" once={true}>
            {(scope) => (
              <div
                class={`grid h-full w-full place-items-center rounded-md border border-border/60 transition-opacity duration-500 ${scope.inView ? "bg-card/40 opacity-100" : "opacity-0"}`}
              >
                <span class="text-[12px] text-muted-foreground">
                  {scope.inView ? "in view ✓" : "waiting for the viewport…"}
                </span>
              </div>
            )}
          </DitherInView>
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
        <DemoCard code={SNIPPET_ICON}>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
            <For each={ICON_NAMES}>
              {(n) => (
                <div class="grid justify-items-center gap-1.5 rounded-md border border-border/60 bg-card/30 px-1 py-3">
                  <DitherIcon class="text-foreground/90" name={n} size={20} />
                  <span class="w-full truncate text-center text-[9px] text-muted-foreground">{n}</span>
                </div>
              )}
            </For>
          </div>
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
        <DemoCard code={SNIPPET_ICON_SET}>
          <div class="grid justify-items-center gap-4">
            <div class="flex items-center gap-5 text-foreground/90">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#di-icon-Star" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#di-icon-Heart" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#di-icon-Bell" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#di-icon-Bookmark" />
              </svg>
            </div>
            <span class="text-[11px] text-muted-foreground">four symbols, one sprite</span>
            <DitherIconSet />
          </div>
        </DemoCard>
        <PropsTable rows={API.iconSet} />
      </DocSection>
    </>
  )
}
