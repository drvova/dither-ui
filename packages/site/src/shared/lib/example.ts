// What a docs example says beside its code: the one place a component's
// demo, its Studio library row, the agent's catalogue and its test states
// are written. An example module (`pages/docs/<pack>/examples/<id>.tsx`)
// may export `meta = defineExample({ … })` holding ONLY what the kit's
// props type cannot say; the build reads it as data (`build/catalog.ts`,
// `virtual-dither-catalog`) and strips it, with this module's import, from
// the text a reader copies (the card's code, Run, the zip). It is the
// site's, never the kit's: a reader's copy has no `meta` to resolve.
import type { PixelColor } from "@dither-ui/kit/engine"
import type { Component } from "solid-js"

/** The Studio library's shelves. */
export type ComponentGroup = "inputs" | "navigation" | "display" | "overlays" | "structure"

/** A Studio setting's control, where the prop's type does not say it all:
 * its kind where the type is not one a control reads (`url`: an address
 * `safeUrl` keeps; `list`: labels the row's mapping reshapes; `text`: a
 * union read as words; `color`: a CSS colour as the kit's swatches;
 * `select`: a few of a wide union's words; `number`: the number of a
 * union that takes another kind too, a `dither` that is also a yes or
 * no), a number's bounds and step, a
 * select's options where the union's members are not them all, and its
 * value on a new frame where neither the example nor the kit's default is
 * it. */
type Control<V> =
  | { min?: number; max?: number; step?: number; options?: readonly string[]; demo?: V }
  | { kind: "text" | "url" | "color"; demo?: string }
  | { kind: "number"; min?: number; max?: number; step?: number; demo?: number }
  | { kind: "select"; options: readonly string[]; demo?: string }
  | { kind: "list"; demo?: readonly string[] }

/** The value a component binds two ways (`modelValue`, or its `prop`). */
type ModelOf<P> = P extends { modelValue?: infer M } ? M : unknown

type ExampleMeta<P extends Record<string, any>> = {
  /** The component the example is about (its row, its props). */
  component: Component<P>
  /** Its name in the Studio's library. */
  title: string
  /** Its row in the Studio's library: where it shelves, the frame a new
   * one takes, its settings in order. A setting's value on a new frame is
   * its `demo`, else what the example hands the prop, else the kit's
   * default. */
  studio?: {
    group: ComponentGroup
    frame: { w: number; h: number }
    controls: NoInfer<{ [K in keyof P]?: Control<NonNullable<P[K]>> }>
    /** Its children's text on a new frame, where the example's is not it. */
    slot?: string
    /** The value it binds on a new frame, where the example binds none or
     * another (`prop`, `event`: where they are not `modelValue` and
     * `update:modelValue`). */
    model?: NoInfer<{ demo?: ModelOf<P>; prop?: keyof P & string; event?: string }>
    /** A text field the Studio puts in a `DitherField` carrying its label. */
    field?: true
  }
  /** Props a reader would set it to: the second values the specs change
   * it to (`tests/site/paint-law.spec.tsx`, the export's type check). */
  states?: readonly NoInfer<Partial<P>>[]
}

/** An example's meta, typed by its component's props. */
export const defineExample = <P extends Record<string, any>>(meta: ExampleMeta<P>): ExampleMeta<P> => meta

/** A Studio setting: a prop's control, its kind and its value on a new frame. */
export type PropSpec =
  | { key: string; kind: "text"; def: string }
  /** An href or a src: a string that `safeUrl` accepts, never a script. */
  | { key: string; kind: "url"; def: string }
  | { key: string; kind: "boolean"; def: boolean }
  | { key: string; kind: "number"; def: number; min?: number; max?: number; step?: number }
  | { key: string; kind: "select"; def: string; options: readonly string[] }
  | { key: string; kind: "color"; def: PixelColor }
  | { key: string; kind: "list"; def: string[] }

/** An example as the build reads it (`virtual-dither-catalog`): its meta
 * resolved against the kit's props types and the example's own values. */
export type CatalogEntry = {
  /** `<pack>/<file>`: `forms/knob`. */
  id: string
  component: string
  title: string
  /** Its Studio row, settings resolved, where its meta gives one. */
  studio: {
    group: ComponentGroup
    frame: { w: number; h: number }
    props: PropSpec[]
    slotText?: string
    model?: { def: unknown; prop?: string; event?: string }
    field?: true
    /** The example is what a new frame of the row renders (the component
     * alone, every prop it is handed a setting at its value): an unedited
     * frame exports the example's own code. */
    faithful: boolean
  } | null
  states: readonly Record<string, unknown>[]
}
