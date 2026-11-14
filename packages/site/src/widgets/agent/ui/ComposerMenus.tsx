import { createSignal, For, Match, onMount, Show, Switch } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import { isMark } from "@/shared/ui/marks"
import ToolMark from "@/shared/ui/ToolMark"
import { msOf, tokensOf } from "../model/composer"
import type { Slash } from "../model/slash"
import type { ComposerProps } from "./Composer"

// The menus over the composer, one at a time: the commands on `/` and the
// frames on `@` (listboxes the field announces; their option is the
// composer's), the model the harness runs, the harness to start, and the
// settings (the bridge's address and the harness's own).
export type ComposerMenusProps = Pick<
  ComposerProps,
  | "config"
  | "pops"
  | "agentName"
  | "hello"
  | "connecting"
  | "harness"
  | "usage"
  | "lastTurnMs"
  | "onStart"
  | "onStopHarness"
  | "onModel"
  | "onSetting"
> & {
  /** The command menu shows (open, with a match). */
  slash: boolean
  slashMatches: Slash[]
  slashIndex: number
  onSlash: (c: Slash) => void
  /** The frame menu shows (even with no frame left to add). */
  at: boolean
  atMatches: { id: string; name: string }[]
  atIndex: number
  onAt: (id: string) => void
}

export default function ComposerMenus(props: ComposerMenusProps) {
  /** The harness to run by a command of your own (the bridge's list aside). */
  const [customCommand, setCustomCommand] = createSignal("")
  const agent = () => props.hello?.agent ?? null
  onMount(() => setCustomCommand(props.config.command))

  return (
    <Switch>
      <Match when={props.slash}>
        <div id="agent-commands" class="pop" role="listbox" aria-label="Commands">
          <For each={props.slashMatches}>
            {(c, i) => (
              <button
                id={`agent-command-${i()}`}
                type="button"
                tabindex="-1"
                role="option"
                aria-selected={i() === props.slashIndex}
                class={`pop-row${i() === props.slashIndex ? " is-active" : ""}`}
                onClick={() => props.onSlash(c)}
              >
                <span class="pop-name">
                  /{c.name}
                  <Show when={c.args}>
                    <span class="dim"> {c.args}</span>
                  </Show>
                </span>
                <span class="dim">
                  {c.harness ? `${props.agentName}: ` : ""}
                  {c.desc}
                </span>
              </button>
            )}
          </For>
        </div>
      </Match>
      <Match when={props.at}>
        <div id="agent-frames" class="pop" role="listbox" aria-label="Frames">
          <For each={props.atMatches}>
            {(a, i) => (
              <button
                id={`agent-frame-${i()}`}
                type="button"
                tabindex="-1"
                role="option"
                aria-selected={i() === props.atIndex}
                class={`pop-row${i() === props.atIndex ? " is-active" : ""}`}
                onClick={() => props.onAt(a.id)}
              >
                <span class="pop-name">
                  <DitherIcon name="Layout" size={11} strokeWidth={1.5} />
                  {a.name}
                </span>
              </button>
            )}
          </For>
          <Show when={!props.atMatches.length}>
            <p class="note">No frame left to add</p>
          </Show>
        </div>
      </Match>
      <Match when={props.pops.model && props.harness.model}>
        {(m) => (
          <div id="agent-model-picker" class="pop" role="group" aria-label="Model">
            <For each={m().options}>
              {(o) => (
                <button
                  type="button"
                  class="pop-row"
                  aria-pressed={o.id === m().current}
                  onClick={() => props.onModel(o.id)}
                >
                  <span class="pop-name">
                    {o.name}
                    <Show when={o.id === m().current}>
                      <DitherIcon name="Check" size={11} strokeWidth={1.5} />
                    </Show>
                  </span>
                  <Show when={o.description}>
                    <span class="dim">{o.description}</span>
                  </Show>
                </button>
              )}
            </For>
          </div>
        )}
      </Match>
      <Match when={props.pops.harness}>
        <div id="agent-harness-picker" class="pop" role="group" aria-label="Harness">
          <Show
            when={props.hello}
            fallback={
              <p class="note">
                {props.connecting ? "Connecting the bridge…" : "No bridge yet: the chat shows the line that starts it."}{" "}
                Then pick Claude Code, Codex, Gemini CLI, oh-my-pi, Goose, OpenCode, or any ACP command here.
              </p>
            }
          >
            <For each={props.hello?.harnesses ?? []}>
              {(h) => (
                <button
                  type="button"
                  class="pop-row"
                  aria-pressed={agent()?.id === h.id}
                  title={h.command}
                  onClick={() => props.onStart(h.id)}
                >
                  <span class="pop-name">
                    {isMark(h.id) ? <ToolMark id={h.id} size={12} /> : null}
                    {h.name}
                    <Show when={agent()?.id === h.id}>
                      <DitherIcon name="Check" size={11} strokeWidth={1.5} />
                    </Show>
                  </span>
                  <span class="dim">{h.installed ? (h.note ?? "on this path") : "not on the path"}</span>
                </button>
              )}
            </For>
            <div class="pop-foot">
              <form
                class="custom"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (customCommand().trim()) props.onStart({ command: customCommand().trim() })
                }}
              >
                <input
                  value={customCommand()}
                  onInput={(e) => setCustomCommand(e.currentTarget.value)}
                  type="text"
                  name="agent-command"
                  class="input"
                  placeholder="any ACP command, e.g. omp --mode acp"
                  autocomplete="off"
                  spellcheck={false}
                  aria-label="Custom harness command"
                />
                <button type="submit" class="key" disabled={!customCommand().trim()}>
                  <span class="row-label">Start</span>
                </button>
              </form>
              <Show when={agent()}>
                {(a) => (
                  <button type="button" class="pop-row text-destructive" onClick={() => props.onStopHarness()}>
                    <span class="pop-name">Stop {a().name}</span>
                  </button>
                )}
              </Show>
            </div>
          </Show>
        </div>
      </Match>
      <Match when={props.pops.settings}>
        <div class="pop menu" role="group" aria-label="Settings">
          <div class="fields">
            <label class="field">
              <span>bridge</span>
              <input
                value={props.config.bridgeUrl}
                onInput={(e) => (props.config.bridgeUrl = e.currentTarget.value.trim())}
                onChange={(e) => (e.currentTarget.value = e.currentTarget.value.trim())}
                name="agent-bridge-url"
                type="text"
                class="input"
                placeholder="ws://127.0.0.1:8790"
                autocomplete="off"
                spellcheck={false}
              />
            </label>
            {/* The harness's own settings, asked of it; nothing kept here. */}
            <For each={props.harness.settings}>
              {(o) => (
                <label class="field">
                  <span>{o.name.toLowerCase()}</span>
                  <select
                    class="input"
                    name={`agent-setting-${o.configId}`}
                    value={o.current}
                    onChange={(e) => props.onSetting(o, e.currentTarget.value)}
                  >
                    <For each={o.options}>
                      {(v) => (
                        <option value={v.id} title={v.description}>
                          {v.name}
                        </option>
                      )}
                    </For>
                  </select>
                </label>
              )}
            </For>
          </div>
          <p class="note">
            {tokensOf(props.usage.input)} in, {tokensOf(props.usage.output)} out
            <Show when={props.lastTurnMs}>, last turn {msOf(props.lastTurnMs)}</Show>
            <Show when={props.hello}>{(at) => <>, in {at().cwd}</>}</Show>
          </p>
          <p class="note">
            The harness runs on your machine behind the bridge; the Studio only sends prompts and answers its tool
            calls. No key lives here; the harness's settings above are its own, asked of it.
          </p>
        </div>
      </Match>
    </Switch>
  )
}
