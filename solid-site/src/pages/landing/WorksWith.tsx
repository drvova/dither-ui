// Plays well with others: what the kit meets on the reader's side, three
// lists at reading size under the section's head. Their styling (each tool
// under its own mark), their agent (the bridge's harnesses, and any command
// besides) and their files (every model format the kit reads, named in the
// kit's order).
import { For } from "solid-js"
import { MODEL_FORMATS } from "@dither-kit/engine/models"
import { HARNESSES, MODEL_NAMES, WORKS } from "@/pages/landing/facts"
import { rise, routePath } from "~/shared/lib"
import ToolMark from "~/shared/ui/ToolMark"
import RiseWords from "./RiseWords"
import "./WorksWith.css"

export default function WorksWith() {
  return (
    <section id="works" aria-labelledby="works-h" class="works-with-scope sec">
      <div ref={rise} class="sec-head">
        <h2 id="works-h" class="section-title">
          <RiseWords text="Plays well with others." />
        </h2>
        <div class="sec-side">
          <p data-rise class="sec-lede">
            <span class="lede-key">Bring the stack you already have.</span> The kit speaks your styling, the bridge
            wakes the agent you are already signed in to, and the 3D surfaces read whatever model is lying around in
            your downloads.
          </p>
          <a data-rise href={routePath("/docs/styling")} class="more-link">
            See the styling switch
          </a>
        </div>
      </div>
      <div ref={rise} class="works">
        <div data-rise>
          <h3 id="works-styling" class="works-h">
            Your styling
          </h3>
          <ul aria-labelledby="works-styling">
            <For each={WORKS}>
              {(t) => (
                <li>
                  <ToolMark id={t.id} size={18} />
                  {t.name}
                </li>
              )}
            </For>
          </ul>
          <p class="works-more">and any app on its compiled stylesheet: UnoCSS, plain CSS or CSS-in-JS</p>
        </div>
        <div data-rise>
          <h3 id="works-agent" class="works-h">
            Your agent
          </h3>
          <ul aria-labelledby="works-agent">
            <For each={HARNESSES}>
              {(h) => (
                <li>
                  <ToolMark id={h.id} size={18} />
                  {h.name}
                </li>
              )}
            </For>
          </ul>
          <p class="works-more">or any command you hand the bridge</p>
        </div>
        <div data-rise>
          <h3 id="works-files" class="works-h">
            Your models
          </h3>
          <ul aria-labelledby="works-files" class="files">
            <For each={MODEL_FORMATS}>{(f) => <li>{MODEL_NAMES[f]}</li>}</For>
          </ul>
          <p class="works-more">and GLSL, pasted straight from Shadertoy</p>
        </div>
      </div>
    </section>
  )
}
