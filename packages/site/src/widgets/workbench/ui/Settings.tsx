// The workbench's settings (one set for every preview): the overlay's
// colours, the copy format, layout bands, snapping, measurements, keeping
// annotations, how stills are taken; restore the defaults; clear this
// preview's annotations.
import { batch, For } from "solid-js"
import { COLOR_FORMATS } from "@/shared/lib/inspect/color"
import { canShareTab } from "@/widgets/workbench/model/capture"
import { DEFAULT_SETTINGS, SWATCHES, swatch, type Swatch } from "@/widgets/workbench/model/settings"
import { ICONS } from "@/widgets/workbench/model/tools"
import { setSounds, sounds } from "@/shared/lib/sound"
import { useBench } from "../context"
import Icon from "./Icon"
import "./Settings.css"

const COLORS: { key: "highlight" | "guide" | "annotate"; label: string }[] = [
  { key: "highlight", label: "highlight" },
  { key: "guide", label: "guides & distances" },
  { key: "annotate", label: "arrows & notes" },
]
const TOGGLES: { key: "layout" | "snap" | "multiMeasure" | "persist"; label: string }[] = [
  { key: "layout", label: "padding, margin and gap bands" },
  { key: "snap", label: "snap guides and arrows to edges" },
  { key: "multiMeasure", label: "keep every Alt+S measurement" },
  { key: "persist", label: "keep annotations across visits" },
]

export default function Settings() {
  const b = useBench()
  const setColor = (key: "highlight" | "guide" | "annotate", s: Swatch) => (b.settings[key] = s)

  return (
    <section class="wb-settings settings-scope" aria-label="Workbench settings">
      <header class="row">
        <span class="micro">Settings</span>
        <span class="dim">for every preview</span>
        <span class="spacer" />
        <button type="button" class="act" aria-label="Close settings" onClick={() => b.setPanel(null)}>
          <Icon d={ICONS.close} size={12} />
        </button>
      </header>
      <For each={COLORS}>
        {(c) => (
          <div class="row" role="radiogroup" aria-label={`${c.label} colour`}>
            <span class="label">{c.label}</span>
            <For each={SWATCHES}>
              {(s) => (
                <button
                  type="button"
                  role="radio"
                  class="chipsw"
                  aria-checked={b.settings[c.key] === s}
                  aria-label={s}
                  style={{ background: swatch(s) }}
                  onClick={() => setColor(c.key, s)}
                />
              )}
            </For>
          </div>
        )}
      </For>
      <div class="row">
        <span class="label">copy colours as</span>
        <div class="seg" role="group" aria-label="Colour format">
          <For each={COLOR_FORMATS}>
            {(f) => (
              <button type="button" aria-pressed={b.settings.format === f} onClick={() => (b.settings.format = f)}>
                {f}
              </button>
            )}
          </For>
        </div>
      </div>
      <For each={TOGGLES}>
        {(t) => (
          <label class="check">
            <input
              checked={b.settings[t.key]}
              type="checkbox"
              onChange={(e) => (b.settings[t.key] = e.currentTarget.checked)}
            />{" "}
            {t.label}
          </label>
        )}
      </For>
      {/* The site's interface-sounds switch (the docs header has it too). */}
      <label class="check">
        <input checked={sounds()} type="checkbox" onChange={(e) => setSounds(e.currentTarget.checked)} /> interface
        sounds (the whole site)
      </label>
      <div class="row">
        <span class="label">stills</span>
        <div class="seg" role="group" aria-label="How stills are taken">
          <button type="button" aria-pressed={b.settings.stills === "dom"} onClick={() => (b.settings.stills = "dom")}>
            render the page
          </button>
          <button
            type="button"
            aria-pressed={b.settings.stills === "screen"}
            disabled={!canShareTab()}
            onClick={() => (b.settings.stills = "screen")}
          >
            exact pixels (shares the tab)
          </button>
        </div>
      </div>
      <div class="row">
        <span class="label">tray</span>
        <div class="seg" role="group" aria-label="Where the tray docks">
          <button
            type="button"
            aria-pressed={b.settings.tray === "bottom"}
            onClick={() => (b.settings.tray = "bottom")}
          >
            bottom
          </button>
          <button type="button" aria-pressed={b.settings.tray === "top"} onClick={() => (b.settings.tray = "top")}>
            top
          </button>
        </div>
      </div>
      <div class="row">
        <button type="button" class="act" onClick={() => batch(() => Object.assign(b.settings, DEFAULT_SETTINGS))}>
          Restore defaults
        </button>
        <button type="button" class="act" onClick={() => b.clearAll()}>
          Clear this preview's annotations
        </button>
      </div>
    </section>
  )
}
