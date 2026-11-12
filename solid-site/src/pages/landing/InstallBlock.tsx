import { createSignal, For, Show } from "solid-js"
import { DitherClipboard, DitherIcon } from "@dither-kit"
import { commandPieces } from "@/pages/landing/command"
import { RUNTIME_DEPS } from "@/pages/landing/facts"
import ToolMark from "~/shared/ui/ToolMark"
import "./InstallBlock.css"

// The command box: its top row the step picker (the site's segmented
// aria-pressed toggles, each under its mark: the kit's folder glyph, then
// npm, pnpm and Bun's own) and the copy key, the command under them (the
// ember prompt, one line). A copy is one gesture in CSS: the command shows
// selected while the key rolls to "Copied" under a check; both let go
// together when the copy settles. The announcement is DitherClipboard's
// own live region.
const STEPS = [
  { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit src/dither-kit" },
  { id: "npm", label: "npm", cmd: `npm i ${RUNTIME_DEPS.join(" ")}` },
  { id: "pnpm", label: "pnpm", cmd: `pnpm add ${RUNTIME_DEPS.join(" ")}` },
  { id: "bun", label: "bun", cmd: `bun add ${RUNTIME_DEPS.join(" ")}` },
] as const

export default function InstallBlock() {
  const [active, setActive] = createSignal(0)
  return (
    <div class="install-block-scope box">
      <div class="box-top">
        <div role="group" aria-label="Install steps" class="seg">
          <For each={STEPS}>
            {(s, i) => (
              <button type="button" aria-pressed={active() === i() ? "true" : "false"} onClick={() => setActive(i())}>
                {s.id === "folder" ? (
                  <DitherIcon name="Folder" size={12} strokeWidth={1.5} />
                ) : (
                  <ToolMark id={s.id} size={12} />
                )}
                {s.label}
              </button>
            )}
          </For>
        </div>
        <DitherClipboard value={STEPS[active()].cmd}>
          {(scope) => (
            <button
              type="button"
              class="copy"
              data-copied={scope.copied ? "true" : "false"}
              aria-label={scope.copied ? "Copied" : "Copy command"}
            >
              <span class="swap" aria-hidden="true">
                <DitherIcon name="Copy" size={13} strokeWidth={1.5} class="swap-a" />
                <DitherIcon name="Check" size={13} strokeWidth={1.5} class="swap-b" />
              </span>
              <span class="roll" aria-hidden="true">
                <span>
                  <span>Copy</span>
                  <span>Copied</span>
                </span>
              </span>
            </button>
          )}
        </DitherClipboard>
      </div>
      <div class="frame">
        <code class="cmd">
          <span class="prompt" aria-hidden="true">
            $
          </span>
          {/* A new step is a new element, so the command types in again. */}
          <Show when={STEPS[active()]} keyed>
            {(step) => (
              <span class="typed">
                <For each={commandPieces(step.cmd)}>
                  {(w, i) => (
                    <>
                      {i() ? " " : ""}
                      <For each={w}>
                        {(p, j) => (
                          <>
                            <Show when={j()}>
                              <wbr />
                            </Show>
                            <span class="word">{p}</span>
                          </>
                        )}
                      </For>
                    </>
                  )}
                </For>
              </span>
            )}
          </Show>
          <span class="caret" aria-hidden="true">
            ▌
          </span>
        </code>
      </div>
    </div>
  )
}
