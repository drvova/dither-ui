// The Quick start: the kit is a folder, so installing it is a few steps a
// reader takes one at a time, each with its own copy (`@/pages/docs/install`
// holds them). Then the question a reader asks next, under its own
// heading: the kit without Tailwind.
import { For, Show } from "solid-js"
import { INSTALL_DEPS, INSTALL_STEPS } from "@/pages/docs/install"
import { CodeBlock } from "~/shared/ui"
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

const LINK =
  "text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60"
const CODE = "text-foreground/80"

export default function QuickStart() {
  const deps = COUNT[INSTALL_DEPS.length] ?? String(INSTALL_DEPS.length)

  return (
    <section id="getting-started" class="quick-start-scope mt-16 scroll-mt-24">
      <h2 class="text-lg tracking-tight">Quick start</h2>
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
    </section>
  )
}
