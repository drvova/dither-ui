import { type Component, createMemo, For, type JSX, Match, Show, Switch } from "solid-js"
import { Dynamic } from "solid-js/web"
import { boundProps, type ComponentEntry, componentEntry, fieldLabel, type WidgetModel } from "@/entities/widget"
import * as kit from "@dither-kit"
import { DitherAvatar, DitherButton, DitherGradient, DitherImage, toast } from "@dither-kit"
import { editor } from "~/entities/editor"
import ReelRenderer from "~/widgets/reel-renderer/ReelRenderer"
import { modelOf, slotChildren } from "../../entities/widget/model/model"
import { FieldWrap } from "./FieldWrap"
import ScreenRenderer from "./ScreenRenderer"
import "./WidgetRenderer.css"

type Kind = WidgetModel["kind"]
type Of<K extends Kind> = Extract<WidgetModel, { kind: K }>

/** What a Vue `:key` did: the surface made anew whenever `by` changes. */
function Keyed(props: { by: string; children: () => JSX.Element }) {
  return <For each={[props.by]}>{() => props.children()}</For>
}

export default function WidgetRenderer(props: { widget: WidgetModel; artboardId: string }) {
  const rt = createMemo(() => editor.replayToken)
  /** The widget, when it is of `kind`. */
  const as =
    <K extends Kind>(kind: K) =>
    () =>
      props.widget.kind === kind ? (props.widget as Of<K>) : null
  const component = as("component")

  // Registry-driven kit component: resolve by export name, map list props.
  const comp = createMemo(() => {
    const w = component()
    return w ? ((kit as Record<string, unknown>)[w.is] as Component<Record<string, unknown>> | undefined) : undefined
  })
  const compProps = createMemo(() => {
    const w = component()
    return w ? boundProps(w.is, w.props) : {}
  })
  const label = createMemo(() => {
    const w = component()
    return w ? fieldLabel(w.is, w.props) : null
  })
  const entry = createMemo(() => {
    const w = component()
    return w ? componentEntry(w.is) : undefined
  })
  const model = createMemo(() => modelOf(entry()))
  const updateModel = (value: unknown) => {
    const w = component()
    if (w) w.model = value
  }
  const triggerToast = () => {
    const w = component()
    if (w) toast(String(w.props.message), { color: w.props.color as never })
  }
  /** The slot's text as children, when the widget has any. */
  const slot = () => {
    const w = component()
    return w?.slotText != null ? { children: slotChildren(w.is, w.slotText) } : {}
  }
  const demo = (name: NonNullable<ComponentEntry["demo"]>) => entry()?.demo === name

  return (
    <Switch
      fallback={
        // GRADIENT — fills the frame
        <Show when={as("gradient")()}>
          {(w) => (
            <div class="relative h-full w-full overflow-hidden rounded-md">
              <Keyed
                by={`${w().from}-${w().twoTone}-${w().to}-${w().direction}-${w().cell}-${w().opacity}-${JSON.stringify(w().bloom)}`}
              >
                {() => (
                  <DitherGradient
                    from={w().from}
                    to={w().twoTone ? w().to : "transparent"}
                    direction={w().direction}
                    cell={w().cell}
                    opacity={w().opacity}
                    bloom={w().bloom}
                  />
                )}
              </Keyed>
            </div>
          )}
        </Show>
      }
    >
      {/* AVATAR — sized to fill the frame's shorter side */}
      <Match when={as("avatar")()}>
        {(w) => (
          <div class="flex h-full w-full items-center justify-center">
            <DitherAvatar
              name={w().name}
              pattern={w().source !== "seed" && w().pattern ? (w().pattern ?? undefined) : undefined}
              color={w().autoColor ? undefined : w().color}
              mirror={w().mirror}
              grid={w().grid}
              cellPx={w().cellPx}
              density={w().density}
              offTier={w().offTier}
              bloom={w().bloom}
              animate={w().animate}
              animationDuration={w().animationDuration}
              replayToken={rt()}
              class="aspect-square h-full max-h-full w-auto rounded-lg"
            />
          </div>
        )}
      </Match>

      {/* BUTTON — centred at natural size */}
      <Match when={as("button")()}>
        {(w) => (
          <div class="flex h-full w-full items-center justify-center">
            <Keyed by={`${w().color}-${w().variant}-${w().cell}-${JSON.stringify(w().bloom)}`}>
              {() => (
                <DitherButton
                  color={w().color}
                  variant={w().variant}
                  cell={w().cell}
                  bloom={w().bloom}
                  class="px-6 py-3 text-sm"
                >
                  {w().label}
                </DitherButton>
              )}
            </Keyed>
          </div>
        )}
      </Match>

      {/* REGISTRY COMPONENT — generic by default, composed where context/slots require it. */}
      <Match when={component()}>
        {(w) => (
          <div class="widget-renderer-scope flex h-full w-full items-center justify-center overflow-visible p-2">
            <Switch>
              <Match when={comp() && !entry()?.demo}>
                <FieldWrap label={label()} class="w-full">
                  <Dynamic
                    component={comp()}
                    {...compProps()}
                    {...(model() ? { [model()!.prop]: w().model, [model()!.on]: updateModel } : {})}
                    {...slot()}
                    class="max-h-full max-w-full"
                  />
                </FieldWrap>
              </Match>

              <Match when={demo("tab-panel")}>
                <kit.DitherTabs tabs={["One", "Two"]} modelValue="One">
                  <kit.DitherTabPanel value="One">{w().slotText}</kit.DitherTabPanel>
                </kit.DitherTabs>
              </Match>
              <Match when={demo("field")}>
                <Dynamic component={comp()} {...compProps()}>
                  <kit.DitherInput placeholder="you@example.com" />
                </Dynamic>
              </Match>
              <Match when={demo("fieldset")}>
                <Dynamic component={comp()} {...compProps()}>
                  <kit.DitherField label="Name">
                    <kit.DitherInput />
                  </kit.DitherField>
                </Dynamic>
              </Match>
              <Match when={demo("form")}>
                <Dynamic component={comp()} {...compProps()} class="grid w-full gap-3">
                  <kit.DitherField label="Email">
                    <kit.DitherInput />
                  </kit.DitherField>
                  <kit.DitherButton>Submit</kit.DitherButton>
                </Dynamic>
              </Match>
              <Match when={demo("screen")}>
                <Dynamic component={comp()} {...compProps()}>
                  <div class="relative h-full w-full overflow-hidden">
                    <kit.DitherGradient from="purple" />
                  </div>
                </Dynamic>
              </Match>
              <Match when={demo("stage")}>
                <Dynamic component={comp()} {...compProps()} class="h-full w-full">
                  <kit.DitherLayer
                    keyframes={[
                      { x: "-30cqw", opacity: 0.3 },
                      { x: "30cqw", opacity: 1 },
                    ]}
                    duration={3}
                    yoyo
                    loop
                    class="grid place-items-center"
                  >
                    <span class="rounded-md border border-border bg-card px-3 py-1 text-xs">
                      layer in container units
                    </span>
                  </kit.DitherLayer>
                  <kit.DitherLayer
                    keyframes={[
                      { rotate: 0, scale: 0.7 },
                      { rotate: "1turn", scale: 1 },
                    ]}
                    duration={6}
                    loop
                    class="grid place-items-center"
                  >
                    <span class="size-12 border border-border/70" />
                  </kit.DitherLayer>
                </Dynamic>
              </Match>
              <Match when={demo("layer")}>
                <kit.DitherStage duration={4} class="h-full w-full">
                  <Dynamic
                    component={comp()}
                    {...compProps()}
                    keyframes={[
                      { x: "-30cqw", y: "-20cqh" },
                      { x: "30cqw", y: "20cqh" },
                    ]}
                    class="grid place-items-center text-xs"
                  >
                    {w().slotText}
                  </Dynamic>
                </kit.DitherStage>
              </Match>
              <Match when={demo("toolbar")}>
                <Dynamic component={comp()} {...compProps()}>
                  <kit.DitherToggle modelValue={false}>Bold</kit.DitherToggle>
                  <kit.DitherToggle modelValue={false}>Italic</kit.DitherToggle>
                </Dynamic>
              </Match>
              <Match when={demo("sidebar")}>
                <Dynamic component={comp()} {...compProps()} modelValue={w().model} onUpdateModelValue={updateModel}>
                  <kit.DitherSidebarGroup label="Workspace">
                    <kit.DitherSidebarItem label="Dashboard" active badge="3" />
                    <kit.DitherSidebarSub label="Projects" modelValue={true}>
                      <kit.DitherSidebarItem label="Website" />
                    </kit.DitherSidebarSub>
                  </kit.DitherSidebarGroup>
                </Dynamic>
              </Match>
              <Match when={demo("toaster")}>
                <button type="button" class="demo-trigger" onClick={triggerToast}>
                  Show toast
                </button>
              </Match>
              <Match when={demo("popover") || demo("preview-card")}>
                <Dynamic
                  component={comp()}
                  {...compProps()}
                  open={w().model}
                  onClose={() => updateModel(false)}
                  trigger={
                    <button type="button" class="demo-trigger" onClick={() => updateModel(true)}>
                      Open {entry()?.label.toLowerCase()}
                    </button>
                  }
                >
                  {w().slotText}
                </Dynamic>
              </Match>
              <Match when={demo("dialog") || demo("alert") || demo("drawer")}>
                <button type="button" class="demo-trigger" onClick={() => updateModel(true)}>
                  Open {entry()?.label.toLowerCase()}
                </button>
                <Dynamic
                  component={comp()}
                  {...compProps()}
                  open={w().model}
                  onClose={() => updateModel(false)}
                  onCancel={() => updateModel(false)}
                  onConfirm={() => updateModel(false)}
                >
                  {w().slotText}
                </Dynamic>
              </Match>
              <Match when={demo("swipe-area")}>
                <span class="text-xs text-muted-foreground">Swipe inward from the {String(w().props.side)} edge</span>
                <Dynamic component={comp()} {...compProps()} onOpen={() => updateModel(true)} />
              </Match>
              <Match when={demo("drawer-indent")}>
                <Dynamic component={comp()} class="rounded-lg border border-border p-6">
                  {w().slotText}
                </Dynamic>
                <button type="button" class="demo-trigger absolute bottom-3" onClick={() => updateModel(true)}>
                  Preview indent
                </button>
                <kit.DitherDrawer open={w().model as boolean} title="Nested drawer" onClose={() => updateModel(false)}>
                  Drawer content
                </kit.DitherDrawer>
              </Match>
            </Switch>
          </div>
        )}
      </Match>

      {/* REEL — plays other frames with dither transitions */}
      <Match when={as("reel")()}>{(w) => <ReelRenderer reel={w()} artboardId={props.artboardId} />}</Match>

      {/* IMAGE — fills the frame */}
      <Match when={as("image")()}>
        {(w) => (
          <div class="relative h-full w-full overflow-hidden rounded-md">
            <Keyed by={`${w().src}-${w().cell}-${w().focusY}-${w().fade}`}>
              {() => (
                <DitherImage
                  src={w().src}
                  alt={w().alt}
                  cell={w().cell}
                  focusY={w().focusY}
                  fade={w().fade}
                  class="h-full w-full"
                />
              )}
            </Keyed>
          </div>
        )}
      </Match>

      {/* SCREEN — composed rows of registry components */}
      <Match when={as("screen")()}>{(w) => <ScreenRenderer screen={w()} artboardId={props.artboardId} />}</Match>
    </Switch>
  )
}
