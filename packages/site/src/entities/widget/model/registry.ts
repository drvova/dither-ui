import type { PixelColor } from "@dither-ui/kit/engine"
import { CATALOG } from "virtual-dither-catalog"
import type { ComponentGroup, PropSpec } from "@/shared/lib/example"
import { safeUrl } from "@/shared/lib/routes"

export type { ComponentGroup, PropSpec }

type ComponentDemo =
  | "alert"
  | "dialog"
  | "drawer"
  | "drawer-indent"
  | "field"
  | "fieldset"
  | "form"
  | "layer"
  | "screen"
  | "stage"
  | "popover"
  | "preview-card"
  | "sidebar"
  | "swipe-area"
  | "tab-panel"
  | "toaster"
  | "toolbar"

export type ComponentEntry = {
  is: string
  label: string
  group: ComponentGroup
  frame: { w: number; h: number }
  props: PropSpec[]
  slotText?: string
  /** The value it binds two ways (a field's text, a switch's state): its
   * default, and the prop and the event that carry it where they are not
   * `modelValue` and `update:modelValue`. Or the state its demo keeps (`demo:
   * true`: the drawer a swipe opens), which the component does not take. */
  model?: { def: unknown; prop?: string; event?: string } | { def: unknown; demo: true }
  /** Its edited props as the component takes them: the canvas binds them
   * and the code export writes them (`boundProps`). */
  mapProps?: (p: Record<string, unknown>) => Record<string, unknown>
  demo?: ComponentDemo
  /** A text field: its `label` prop is not the component's but the
   * visible label a DitherField ties to it (`labelled`, `fieldLabel`). */
  field?: true
  /** The docs example (its catalogue id) a new frame of the row is: what
   * an unedited frame exports as its code. */
  example?: string
}

const bool = (key: string, def = false): PropSpec => ({ key, kind: "boolean", def })
const number = (key: string, def: number, min?: number, max?: number, step?: number): PropSpec => ({
  key,
  kind: "number",
  def,
  min,
  max,
  step,
})
const select = (key: string, def: string, options: readonly string[]): PropSpec => ({
  key,
  kind: "select",
  def,
  options,
})
/** A text field that takes a visible label: the kit's own pairing, the
 * field inside a DitherField (whose label is tied to the control the
 * field reads from its context), done for it when `label` is set. */
const labelled = (entry: ComponentEntry): ComponentEntry => ({
  ...entry,
  field: true,
  props: [{ key: "label", kind: "text", def: "" }, ...entry.props],
})
const strList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String)
    : String(v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
const options = (v: unknown) => strList(v).map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }))
const optionProps = (p: Record<string, unknown>) => ({ ...p, options: options(p.options) })
const items = (labels: unknown) => strList(labels).map((label) => ({ label }))

/** The row a docs example makes (its `meta`, resolved by the build:
 * `virtual-dither-catalog`), with what is code beside it: the mapping its
 * settings take to the component, the demo the Studio wraps it in. */
function example(is: string, code: Pick<ComponentEntry, "mapProps" | "demo"> = {}): ComponentEntry {
  const found = CATALOG.find((e) => e.component === is && e.studio)
  if (!found?.studio) throw new Error(`no docs example gives ${is} a Studio row`)
  const { group, frame, props, story = [], slotText, model, field } = found.studio
  const entry: ComponentEntry = {
    is,
    label: found.title,
    group,
    frame,
    props: [...story, ...props],
    slotText,
    model,
    ...code,
  }
  if (found.studio.faithful) entry.example = found.id
  return field ? labelled(entry) : entry
}

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  example("DitherSwitch"),
  example("DitherCheckbox"),
  example("DitherToggle"),
  example("DitherSlider"),
  example("DitherInput"),
  example("DitherTextarea"),
  example("DitherNumberField"),
  example("DitherOtpField"),
  example("DitherSelect", { mapProps: optionProps }),
  example("DitherCombobox", { mapProps: optionProps }),
  example("DitherAutocomplete"),
  example("DitherWheelPicker", { mapProps: optionProps }),
  example("DitherRadioGroup", { mapProps: optionProps }),
  example("DitherCheckboxGroup", { mapProps: optionProps }),
  example("DitherToggleGroup", { mapProps: optionProps }),
  example("DitherTabs", { mapProps: (p) => ({ ...p, tabs: strList(p.tabs) }) }),
  example("DitherTabPanel", { demo: "tab-panel" }),
  example("DitherAccordion", {
    mapProps: (p) => ({
      ...p,
      items: strList(p.items).map((title) => ({ value: title.toLowerCase().replace(/\s+/g, "-"), title })),
    }),
  }),
  example("DitherBouncyAccordion", {
    mapProps: (p) => ({
      ...p,
      items: strList(p.items).map((label) => ({
        value: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        hint: `${label} details`,
        content: `${label} content settles on a weighted spring.`,
      })),
    }),
  }),
  example("DitherCollapsible"),

  example("DitherBreadcrumb", { mapProps: (p) => ({ ...p, items: items(p.items) }) }),
  example("DitherPagination"),
  example("DitherRating"),
  example("DitherStepper", { mapProps: (p) => ({ ...p, steps: items(p.steps) }) }),
  example("DitherTimeline", {
    mapProps: (p) => ({
      ...p,
      items: strList(p.items).map((title, i) => ({ title, time: `${i + 9}:00`, body: `${title} event` })),
    }),
  }),
  example("DitherNavMenu", { mapProps: (p) => ({ ...p, items: items(p.items) }) }),

  example("DitherBadge"),
  example("DitherKbd"),
  example("DitherProgress"),
  example("DitherGauge"),
  example("DitherScope"),
  example("DitherMeter"),
  example("DitherBox"),
  example("DitherText"),
  example("DitherDivider"),
  example("DitherVisuallyHidden"),
  example("DitherSvg"),
  example("DitherImg"),
  example("DitherSpacer"),
  example("DitherPortal"),
  example("DitherOverlay"),
  example("DitherMeasure"),
  example("DitherClipboard"),
  example("DitherClickOutside"),
  example("DitherFocusRing"),
  example("DitherFocusScope"),
  example("DitherHoverArea"),
  example("DitherPressable"),
  example("DitherInView"),
  example("DitherIcon"),
  example("DitherIconSet"),
  example("DitherHeading"),
  example("DitherLabel"),
  example("DitherCaption"),
  example("DitherOverline"),
  example("DitherCode"),
  example("DitherKbdCombo", { mapProps: (p) => ({ ...p, keys: strList(p.keys) }) }),
  example("DitherBlockquote"),
  example("DitherHighlight"),
  example("DitherTruncate"),
  example("DitherLineClamp", { mapProps: (p) => ({ ...p, lines: Number(p.lines) }) }),
  example("DitherMiddleEllipsis"),
  example("DitherEllipsisTooltip"),
  example("DitherLink"),
  example("DitherExternalLink"),
  example("DitherSelectableText"),
  example("DitherCopyableText"),
  example("DitherNumberText"),
  example("DitherCurrencyText"),
  example("DitherPercentText"),
  example("DitherFileSizeText"),
  example("DitherDurationText"),
  example("DitherRelativeTime", { mapProps: (p) => ({ ...p, date: Date.now() - 90_000 }) }),
  example("DitherDateTimeText"),
  example("DitherPluralText"),
  example("DitherEmoji"),
  example("DitherPasswordInput"),
  example("DitherSearchInput"),
  example("DitherEmailInput"),
  example("DitherPhoneInput"),
  example("DitherCurrencyInput"),
  example("DitherScrubInput"),
  example("DitherHotkeyInput"),
  example("DitherCodeInput"),
  example("DitherInputGroup"),
  example("DitherInlineEdit"),
  example("DitherTagInput"),
  example("DitherChoiceChips"),
  example("DitherCheckboxCard"),
  example("DitherKeyValueInput"),
  example("DitherMentionInput"),
  example("DitherFileInput"),
  example("DitherListBox"),
  example("DitherMultiSelect"),
  example("DitherCascadeSelect", {
    mapProps: (p) => ({
      ...p,
      tree: [{ value: "Japan", children: [{ value: "Kansai", children: [{ value: "Kyoto" }, { value: "Osaka" }] }] }],
    }),
  }),
  example("DitherTransferList", {
    mapProps: (p) => ({ ...p, source: ["admin", "editor", "viewer", "billing", "support"] }),
  }),
  example("DitherLanguageSelect"),
  example("DitherIconPicker"),
  example("DitherFontPicker"),
  example("DitherCalendar"),
  example("DitherDatePicker"),
  example("DitherMonthPicker"),
  example("DitherColorSwatch"),
  example("DitherColorPicker"),
  example("DitherKnob"),
  example("DitherSignaturePad"),
  example("DitherSpinner"),
  example("DitherAurora"),
  example("DitherCircuit"),
  example("DitherHeatTrail"),
  example("DitherWaves"),
  example("DitherPoster"),
  example("DitherScreen", { demo: "screen" }),
  example("DitherSilk"),
  example("DitherPlasma"),
  example("DitherLineWaves"),
  example("DitherThreads"),
  example("DitherDotGrid"),
  example("DitherRippleGrid"),
  example("DitherIridescence"),
  example("DitherPixelSnow"),
  example("DitherBeams"),
  example("DitherGridMotion"),
  example("DitherGridScan"),
  example("DitherGridDistortion"),
  example("DitherLightRays"),
  example("DitherSideRays"),
  example("DitherLightPillar"),
  example("DitherSoftAurora"),
  example("DitherDotField"),
  example("DitherColorBends"),
  example("DitherGradientBlinds"),
  example("DitherGrainient"),
  example("DitherDither"),
  example("DitherFloatingLines"),
  example("DitherPlasmaWave"),
  example("DitherRadar"),
  example("DitherLetterGlitch"),
  example("DitherShapeGrid"),
  example("DitherLightning"),
  example("DitherDarkVeil"),
  example("DitherLiquidChrome"),
  example("DitherOrb"),
  example("DitherPrism"),
  example("DitherGalaxy"),
  example("DitherBalatro"),
  example("DitherBallpit"),
  example("DitherEvilEye"),
  example("DitherHyperspeed"),
  example("DitherLightfall"),
  example("DitherLiquidEther"),
  example("DitherParticles"),
  example("DitherPixelBlast"),
  example("DitherPrismaticBurst"),
  example("DitherFaultyTerminal"),
  example("DitherFerrofluid"),
  example("DitherSkeleton"),
  example("DitherSeparator"),
  example("DitherTooltip"),
  example("DitherPreviewCard", { demo: "preview-card" }),

  example("DitherMenu", { mapProps: (p) => ({ ...p, items: items(p.items) }) }),
  example("DitherContextMenu", { mapProps: (p) => ({ ...p, items: items(p.items) }) }),
  example("DitherMenubar", {
    mapProps: (p) => ({
      ...p,
      menus: strList(p.menus).map((label) => ({ label, items: [{ label: "Open" }, { label: "Settings" }] })),
    }),
  }),
  example("DitherPopover", { demo: "popover" }),
  example("DitherDialog", { demo: "dialog" }),
  example("DitherCenterMorphModal", { demo: "dialog" }),
  example("DitherCommand", {
    demo: "dialog",
    mapProps: (p) => ({ ...p, items: strList(p.items).map((label) => ({ value: label.toLowerCase(), label })) }),
  }),
  example("DitherAlertDialog", { demo: "alert" }),
  example("DitherDrawer", { demo: "drawer" }),
  // kept by hand: the value it binds is its demo's open drawer (`demo: true`), no prop of its own
  {
    is: "DitherSwipeArea",
    label: "Swipe area",
    group: "overlays",
    frame: { w: 300, h: 150 },
    props: [
      select("side", "right", ["right", "left", "bottom"]),
      number("size", 24, 8, 64),
      number("threshold", 24, 8, 100),
      bool("disabled"),
    ],
    model: { def: false, demo: true },
    demo: "swipe-area",
  },
  example("DitherToaster", { mapProps: () => ({}), demo: "toaster" }),

  example("DitherField", { demo: "field" }),
  example("DitherFieldset", { demo: "fieldset" }),
  example("DitherForm", { demo: "form" }),
  example("DitherScrollArea"),
  example("DitherShell"),
  example("DitherRail", { demo: "sidebar" }),
  example("DitherConsole"),
  example("DitherCanvas"),
  example("DitherGrid"),
  example("DitherToolbar", { demo: "toolbar" }),
  example("DitherSidebar", { demo: "sidebar" }),
  example("DitherSidebarItem", { demo: "sidebar" }),
  example("DitherSidebarGroup", { demo: "sidebar" }),
  example("DitherSidebarSub", { demo: "sidebar" }),
  // kept by hand: the value it binds is its demo's open drawer (`demo: true`), no prop of its own
  {
    is: "DitherDrawerIndent",
    label: "Drawer indent",
    group: "structure",
    frame: { w: 320, h: 180 },
    props: [],
    slotText: "Indented application surface",
    model: { def: false, demo: true },
    demo: "drawer-indent",
  },

  example("DitherGradientText"),
  example("DitherShinyText"),
  example("DitherGlitchText"),
  example("DitherSplitText"),
  example("DitherRotatingText", { mapProps: (p) => ({ ...p, texts: strList(p.texts) }) }),
  example("DitherCountUp"),
  example("DitherNumberFlow"),
  example("DitherExpandTabs", {
    mapProps: (p) => ({ ...p, tabs: strList(p.tabs).map((label) => ({ value: label.toLowerCase(), label })) }),
  }),
  example("DitherIsland"),
  example("DitherCardStack"),
  example("DitherScrollProgress"),
  example("DitherDock", {
    mapProps: (p) => ({ ...p, items: strList(p.items).map((label) => ({ value: label.toLowerCase(), label })) }),
  }),
  example("DitherPreviewRail", {
    mapProps: (p) => ({ ...p, items: strList(p.items).map((label) => ({ value: label.toLowerCase(), label })) }),
  }),
  example("DitherVideoPlayer"),
  example("DitherWorld"),
  example("DitherShader"),
  example("DitherBracket", {
    mapProps: (p) => {
      const t = strList(p.teams)
      const rounds = [] as { a: string; b: string }[][]
      const first = [] as { a: string; b: string }[]
      for (let i = 0; i + 1 < t.length; i += 2) first.push({ a: t[i], b: t[i + 1] })
      rounds.push(first)
      let n = first.length
      while (n > 1) {
        rounds.push(Array.from({ length: Math.floor(n / 2) }, () => ({ a: "TBD", b: "TBD" })))
        n = Math.floor(n / 2)
      }
      const { teams: _teams, ...rest } = p
      return { ...rest, rounds }
    },
  }),
  example("DitherSchedule", {
    mapProps: (p) => {
      const colors = ["blue", "purple", "green", "orange"]
      const events = strList(p.slots).map((s, i) => {
        const [start, end, label] = s.split("|")
        return {
          start: Number(start) || 9,
          end: Number(end) || 10,
          label: label ?? "Event",
          color: colors[i % colors.length],
        }
      })
      const { slots: _slots, ...rest } = p
      return { ...rest, events }
    },
  }),
  example("DitherInfiniteCanvas"),
  example("DitherSnapButton"),
  example("DitherExpandingArrow"),
  example("DitherSlideAction"),
  example("DitherHoldAction"),
  example("DitherWalletCard", {
    mapProps: (p) => ({
      ...p,
      accounts: strList(p.accounts).map((label, i) => ({
        value: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        address: `0x${(i + 7).toString(16)}f3a9c2e14b7d55aa93${(i * 41 + 13).toString(16)}`,
        balance: [12480.52, 8210.11, 3033.7, 20419.08][i % 4],
        change: [2.4, -1.1, 0.6, 4.2][i % 4],
      })),
    }),
  }),
  example("DitherNotificationStack", {
    mapProps: (p) => ({
      ...p,
      items: strList(p.items).map((title, i) => ({
        id: `n${i}`,
        title,
        body: `${title}: details inside.`,
        time: ["2m", "16m", "1h", "3h", "1d"][i % 5],
        color: (["green", "blue", "orange", "purple", "red"] as const)[i % 5],
      })),
    }),
  }),
  example("DitherGooeyMenu", {
    mapProps: (p) => ({ ...p, items: strList(p.items).map((label) => ({ value: label.toLowerCase(), label })) }),
  }),
  example("DitherBlurText"),
  example("DitherDecryptedText"),
  example("DitherScrambleText"),
  example("DitherShuffle"),
  example("DitherTextType", { mapProps: (p) => ({ ...p, texts: strList(p.texts) }) }),
  example("DitherFallingText"),
  example("DitherScrollReveal"),
  example("DitherScrollFloat"),
  example("DitherScrollVelocity"),
  example("DitherTextCursor"),
  example("DitherTextPressure"),
  example("DitherVariableProximity"),
  example("DitherTrueFocus"),
  example("DitherCircularText"),
  example("DitherCurvedLoop"),
  example("DitherFuzzyText"),
  example("DitherAsciiText"),
  example("DitherAnimatedContent"),
  example("DitherFadeContent"),
  example("DitherSequence"),
  example("DitherContainer"),
  example("DitherStage", { demo: "stage" }),
  example("DitherLayer", { demo: "layer" }),
  example("DitherGradualBlur"),
  example("DitherStarBorder"),
  example("DitherElectricBorder"),
  example("DitherGlareHover"),
  example("DitherMagnet"),
  example("DitherClickSpark"),
  example("DitherBlobCursor"),
  example("DitherCrosshair"),
  example("DitherGhostCursor"),
  example("DitherSplashCursor"),
  example("DitherTargetCursor"),
  example("DitherPixelTrail"),
  example("DitherImageTrail"),
  example("DitherMetaBalls"),
  example("DitherMetallicPaint"),
  example("DitherNoise"),
  example("DitherCubes"),
  example("DitherRibbons"),
  example("DitherShapeBlur"),
  example("DitherStrands"),
  example("DitherLaserFlow"),
  example("DitherAntigravity"),
  example("DitherLogoLoop"),
  example("DitherMagicRings"),
  example("DitherMagnetLines"),
  example("DitherOrbitImages"),
  example("DitherPixelTransition"),
  example("DitherReveal"),
  example("DitherStickerPeel"),
  example("DitherFlowField"),
  example("DitherThumbnail"),
]

export const componentEntry = (is: string): ComponentEntry | undefined => COMPONENT_REGISTRY.find((e) => e.is === is)

/** A field's visible label, when it has one: the canvas and the code
 * export put the field inside a DitherField carrying it. */
export function fieldLabel(is: string, props: Record<string, unknown>): string | null {
  const label = componentEntry(is)?.field && typeof props.label === "string" ? props.label.trim() : ""
  return label || null
}

/** The props a registry component is bound with: mapped where its entry
 * maps them, a field's label left to its DitherField. */
export function boundProps(is: string, props: Record<string, unknown>): Record<string, unknown> {
  const entry = componentEntry(is)
  const mapped = entry?.mapProps ? entry.mapProps(props) : props
  if (!entry?.field) return mapped
  const rest = { ...mapped }
  delete rest.label
  return rest
}

/** What the toaster's demo hands `toast()` from its row's settings: the
 * canvas's "Show toast" and the code export's call. */
export const demoToast = (props: Record<string, unknown>): { message: string; color: PixelColor } => ({
  message: String(props.message ?? ""),
  color: props.color as PixelColor,
})

export function defaultComponentProps(entry: ComponentEntry): Record<string, unknown> {
  return Object.fromEntries(entry.props.map((p) => [p.key, p.def]))
}

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/** The longest bound value (`model`) a document may carry, as JSON. */
const MODEL_MAX = 20_000
const kindOf = (v: unknown) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v)
/** A component's bound value (its `model`: a field's text, a switch's state)
 * as a document or an agent hands it: the same
 * kind as its default (text, number, yes/no, list, record; a default of
 * null takes text or a number too), plain JSON within `MODEL_MAX`, else the
 * default. A component that binds no value has none. */
export function sanitizeModel(entry: ComponentEntry, raw: unknown): unknown {
  if (!entry.model) return undefined
  const def = entry.model.def
  const fallback = () => (def === undefined ? undefined : JSON.parse(JSON.stringify(def)))
  const fits = kindOf(raw) === kindOf(def) || (def === null && (typeof raw === "string" || typeof raw === "number"))
  if (raw === undefined || !fits || (typeof raw === "number" && !Number.isFinite(raw))) return fallback()
  let json: string | undefined
  try {
    json = JSON.stringify(raw)
  } catch {
    return fallback()
  }
  return json === undefined || json.length > MODEL_MAX ? fallback() : JSON.parse(json)
}

export function sanitizeComponentProps(entry: ComponentEntry, raw: unknown): Record<string, unknown> {
  const src = isPlain(raw) ? raw : {}
  const out: Record<string, unknown> = {}
  for (const spec of entry.props) {
    const v = src[spec.key]
    switch (spec.kind) {
      case "text":
        out[spec.key] = typeof v === "string" ? v : spec.def
        break
      case "url":
        out[spec.key] = typeof v === "string" && safeUrl(v) ? v : spec.def
        break
      case "boolean":
        out[spec.key] = typeof v === "boolean" ? v : spec.def
        break
      case "number": {
        let n = typeof v === "number" && Number.isFinite(v) ? v : spec.def
        if (spec.min != null) n = Math.max(spec.min, n)
        if (spec.max != null) n = Math.min(spec.max, n)
        out[spec.key] = n
        break
      }
      case "select":
        out[spec.key] = spec.options.includes(v as string) ? v : spec.def
        break
      case "color":
        out[spec.key] = typeof v === "string" || typeof v === "number" ? v : spec.def
        break
      case "list":
        out[spec.key] = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [...spec.def]
        break
    }
  }
  return out
}
