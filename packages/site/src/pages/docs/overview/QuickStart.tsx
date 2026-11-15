// The Quick start: the kit is a folder, so installing it is a few steps a
// reader takes one at a time, each with its own copy (`@/pages/docs/install`
// holds them). Then the questions a reader asks next, each under its own
// heading: one component at a time (the add command), and the kit without
// Tailwind.
import { createSignal, For, onMount, Show } from "solid-js"
import { INSTALL_DEPS, INSTALL_STEPS } from "@/pages/docs/install"
import { addCommand } from "@/shared/lib/add-command"
import { assetPath } from "@/shared/lib/routes"
import CodeBlock from "@/shared/ui/CodeBlock"
import DocSection from "../DocSection"
import "./QuickStart.css"

const COUNT = ["no", "one", "two", "three", "four", "five", "six"]

const ANY_STYLES = `<!-- No Tailwind? One plain stylesheet: the tokens, a base scoped to
     .dither-kit and every class the components use. -->
<link rel="stylesheet" href="https://dither-ui.com/kit/dither-kit.css">

<div class="dither-kit">
  <DitherButton class="cta">Ship</DitherButton>
</div>`

const THEME = `import { applyTheme, themeCss } from "@dither-kit"

applyTheme({ accent: "#3f8ff3", radius: "4px" })  // on <html>, returns the undo
themeCss({ background: "#000" }, ".dark")          // a rule for your stylesheet`

/** What else the add command does, after the line that runs it. */
const ADD_USES = `add DitherButton AreaChart Area   # components and every kit file they need
add DitherWorld --styling stylex  # tailwind, css, modules or stylex
add DitherButton --dry-run        # what would change, nothing written
diff DitherButton                 # what differs between your copy and the site
list                              # every component you can add`

const LINK =
  "text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60"
const CODE = "text-foreground/80"

export default function QuickStart() {
  const deps = COUNT[INSTALL_DEPS.length] ?? String(INSTALL_DEPS.length)
  const [site, setSite] = createSignal<string>()
  onMount(() => setSite(new URL(assetPath(""), location.origin).href))

  return (
    <DocSection id="getting-started" class="quick-start-scope">
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        The kit is a folder, not a package. Copy <code class={CODE}>dither-kit/</code> from the{" "}
        <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class={LINK}>
          GitHub repo<span class="sr-only"> (opens in a new tab)</span>
        </a>
        , install {deps} small runtime deps and alias it. You already have Solid, and Tailwind if you use it.
      </p>

      <ol class="mt-6 flex flex-col gap-6" aria-label="Install steps">
        <For each={INSTALL_STEPS}>
          {(step, i) => (
            <li class="qs-step">
              <span class="qs-n" aria-hidden="true">
                {i() + 1}
              </span>
              <div class="min-w-0">
                <p class="text-[13px] text-foreground">{step.title}</p>
                <Show when={step.why}>
                  <p class="mt-0.5 text-[12px] text-muted-foreground">{step.why}</p>
                </Show>
              </div>
              <div class="qs-code">
                <CodeBlock code={step.code} />
              </div>
            </li>
          )}
        </For>
      </ol>

      <h3 class="mt-10 text-[13px] text-foreground">One component at a time</h3>
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Rather take only what you use? One line copies a component and every kit file it imports into{" "}
        <code class={CODE}>src/dither-kit/</code>, in your styling system, with an index of just what you added. Run it
        again to add more; it never replaces a file you changed, it shows you the difference instead. Every component's
        page carries its own line.
      </p>
      <div class="mt-3">
        <CodeBlock code={addCommand(["DitherButton"], { site: site() })} />
      </div>
      <p class="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        Each of these goes after the same <code class={CODE}>node --input-type=module -</code>, and the script keeps
        your choices in <code class={CODE}>dither-kit.json</code> for the next run:
      </p>
      <div class="mt-3">
        <CodeBlock code={ADD_USES} />
      </div>

      <h3 class="mt-10 text-[13px] text-foreground">Without Tailwind</h3>
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        The kit brings its own stylesheet, in cascade layers so your styles win. Pick your system in the header and
        every snippet here, every Studio export and the agent's <code class={CODE}>code.get</code> come out as a scoped
        stylesheet, CSS Modules or StyleX.
      </p>
      <div class="mt-3">
        <CodeBlock code={ANY_STYLES} />
      </div>
      <p class="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        The tokens are plain custom properties, so theme from CSS, JS or any vars contract:
      </p>
      <div class="mt-3">
        <CodeBlock code={THEME} />
      </div>

      <p class="mt-6 text-[12px] leading-relaxed text-muted-foreground">
        Prefer to read the source first? Every component lives under{" "}
        <a
          href="https://github.com/drvova/dither-ui/tree/master/dither-kit"
          target="_blank"
          rel="noreferrer"
          class={LINK}
        >
          dither-kit/<span class="sr-only"> (opens in a new tab)</span>
        </a>
        . No build step, no black box.
      </p>
    </DocSection>
  )
}
