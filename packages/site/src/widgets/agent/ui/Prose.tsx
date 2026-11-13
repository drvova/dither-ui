import { createMemo, createSignal, Index, type JSX, Match, onCleanup, Show, Switch } from "solid-js"
import { Dynamic } from "solid-js/web"
import { copyText, DitherIcon } from "dither-kit"
import { type Block, type Inline, parseProse } from "@/widgets/agent/model/prose"
import "./Prose.css"

// A reply set as prose: its blocks as elements, never as HTML.
export type ProseProps = { text: string; live?: boolean }
type Line = Inline[]
type Of<K extends Block["kind"]> = Extract<Block, { kind: K }>

/** One line's spans: code, bold, or its words. */
const spans = (line: () => Line): JSX.Element => (
  <Index each={line()}>
    {(s) => (
      <Switch fallback={s().text}>
        <Match when={s().kind === "code"}>
          <code>{s().text}</code>
        </Match>
        <Match when={s().kind === "strong"}>
          <strong>{s().text}</strong>
        </Match>
      </Switch>
    )}
  </Index>
)

export default function Prose(props: ProseProps) {
  const blocks = createMemo(() => parseProse(props.text))
  const last = createMemo(() => blocks().length - 1)
  /** The code block just copied, by its place, for a moment. */
  const [copied, setCopied] = createSignal<number | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy(at: number, text: string) {
    if (!(await copyText(text))) return
    setCopied(at)
    clearTimeout(timer)
    timer = setTimeout(() => setCopied(null), 1600)
  }
  onCleanup(() => clearTimeout(timer))

  return (
    <div class="prose-scope prose">
      <Index each={blocks()}>
        {(b, i) => (
          <Switch
            fallback={
              <p>
                {spans(() => (b() as Of<"paragraph">).inline)}
                <Show when={props.live && i === last()}>
                  <span class="caret" aria-hidden="true"></span>
                </Show>
              </p>
            }
          >
            <Match when={b().kind === "heading" && (b() as Of<"heading">)}>
              {(h) => (
                <Dynamic component={`h${h().level + 2}`} class="h">
                  {spans(() => h().inline)}
                </Dynamic>
              )}
            </Match>
            <Match when={b().kind === "list" && (b() as Of<"list">)}>
              {(l) => (
                <Dynamic component={l().ordered ? "ol" : "ul"}>
                  <Index each={l().items as Line[]}>{(item) => <li>{spans(item)}</li>}</Index>
                </Dynamic>
              )}
            </Match>
            <Match when={b().kind === "code" && (b() as Of<"code">)}>
              {(c) => (
                <div class="code">
                  <pre data-lang={c().lang || undefined}>
                    <code>{c().text}</code>
                  </pre>
                  <Show when={!props.live || i !== last()}>
                    <button
                      type="button"
                      class="row-key code-copy"
                      aria-label={copied() === i ? "Copied" : "Copy code"}
                      title={copied() === i ? "Copied" : "Copy code"}
                      onClick={() => copy(i, c().text)}
                    >
                      <DitherIcon name={copied() === i ? "Check" : "Copy"} size={12} strokeWidth={1.5} />
                    </button>
                  </Show>
                </div>
              )}
            </Match>
          </Switch>
        )}
      </Index>
      <Show when={props.live && !blocks().length}>
        <p>
          <span class="caret" aria-hidden="true"></span>
        </p>
      </Show>
    </div>
  )
}
