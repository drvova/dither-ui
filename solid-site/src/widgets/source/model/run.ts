// The runtime half of Run: compiled files evaluated against the page's own
// Solid (so the result mounts inside the docs app, on the page's one
// reactive graph). An example that only edits itself links to the page's
// kit, the very modules the docs run on. Once a kit file is edited, the
// example links to a kit evaluated from its source instead — the edited
// files and everything they and the example reach — so a compound component
// and its contexts (chart, series, field, drawer) share one consistent set
// of modules. Loaded with the compiler on the first Run.
import * as Solid from "solid-js"
import * as SolidStore from "solid-js/store"
import * as SolidWeb from "solid-js/web"
import { clsx } from "clsx"
import { scaleBand, scaleLinear, scalePoint } from "d3-scale"
import { stack, stackOffsetExpand } from "d3-shape"
import type { Component } from "solid-js"
import { twMerge } from "tailwind-merge"
import * as Kit from "@dither-kit"
import * as StyleX from "@/widgets/source/model/stylex"
import {
  type Compiled,
  CompileError,
  compiler,
  cssModule,
  evaluate,
  hashId,
  type Problem,
  scopeTokens,
} from "./compile"
import { kitFilesOf, resolveKitFile } from "./files"

// What a file can import: Solid as the page runs it (everything a compiled
// template calls is in `solid-js/web`), and the packages the kit's own files
// import (tests/site/source.spec.tsx holds this list to every import in the
// kit).
export const PACKAGES: Record<string, Record<string, unknown>> = {
  "solid-js": Solid,
  "solid-js/store": SolidStore,
  "solid-js/web": SolidWeb,
  // StyleX done at run time (the Vue site's stand-in): what an app's bundler plugin compiles.
  "@stylexjs/stylex": StyleX,
  clsx: { clsx },
  "d3-scale": { scaleBand, scaleLinear, scalePoint },
  "d3-shape": { stack, stackOffsetExpand },
  "tailwind-merge": { twMerge },
}

const KIT = "@dither-kit"
const META = { env: { DEV: import.meta.env.DEV, PROD: import.meta.env.PROD, MODE: import.meta.env.MODE } }
const IMPORTS = /\b(?:from|import)\s*["'](\.[^"']+)["']/g

export interface RunInput {
  /** The card the run belongs to (scope ids, the tokens' scope). */
  scope: string
  example: { path: string; text: string }
  /** The stylesheet the example imports (CSS, CSS Modules), by its file name. */
  sheet?: { file: string; text: string }
  /** Edited kit files, by their path inside the kit. */
  kit: { file: string; text: string }[]
  /** The edited tokens stylesheet, if it was edited. */
  tokens?: string
  /** The kit's public exports (`kitIndex`) and its file list. */
  index: Map<string, { file: string; name: string }>
  files: readonly string[]
  /** A kit file's original text. */
  source(file: string): Promise<string>
}

export interface RunResult {
  component: Component
  css: string
  /** The selector the scoped tokens apply to: put it on the preview. */
  attribute: string
}

/** Compile and link a run. Throws `CompileError` with every problem found. */
export async function run(input: RunInput): Promise<RunResult> {
  const compile = await compiler()
  const edited = new Map(input.kit.map((f) => [f.file, f.text]))
  const deep = [...input.example.text.matchAll(/from\s*["']@dither-kit\/([^"']+)["']/g)].length > 0
  const fresh = edited.size > 0 || deep
  // The kit files the run reaches — from the edited files and, for a kit
  // evaluated from source, from what the example imports — read up front:
  // the linker evaluates synchronously.
  const texts = new Map(edited)
  let wave = [...edited.keys(), ...(fresh ? kitFilesOf(input.example.text, "solid", input.index, input.files) : [])]
  while (wave.length) {
    const next = new Set<string>()
    for (const file of wave) {
      if (!texts.has(file)) next.add(file)
      for (const m of (texts.get(file) ?? "").matchAll(IMPORTS)) {
        const dep = resolveKitFile(m[1], input.files, file)
        if (dep && !texts.has(dep)) next.add(dep)
      }
    }
    const loaded = await Promise.all([...next].map(async (f) => [f, await input.source(f)] as const))
    for (const [f, text] of loaded) texts.set(f, text)
    wave = loaded.map(([f]) => f)
  }

  const attribute = `data-run-${hashId(input.scope)}`
  const css: string[] = []
  const problems: Problem[] = []
  const attempt = (file: string, text: string): Compiled | undefined => {
    try {
      return compile(file, text)
    } catch (e) {
      if (!(e instanceof CompileError)) throw e
      problems.push(...e.problems)
    }
  }
  const compiled = new Map<string, Compiled>()
  for (const [file, text] of edited) {
    const out = attempt(`/dither-kit/${file}`, text)
    if (out) compiled.set(file, out)
  }
  const example = attempt(input.example.path, input.example.text)
  if (problems.length || !example) throw new CompileError(problems)

  // The kit from source: each file compiled and evaluated the first time
  // something imports it. A file is in the cache from the moment it starts,
  // so two that import each other see what the other has made so far.
  const cache = new Map<string, Record<string, unknown>>()
  const kitFile = (file: string): Record<string, unknown> => {
    const hit = cache.get(file)
    if (hit) return hit
    const text = texts.get(file)
    if (text === undefined) throw new Error(`Run couldn't read the kit's ${file}`)
    if (file.endsWith(".css")) {
      // a component's own stylesheet comes with it
      css.push(text)
      cache.set(file, {})
      return {}
    }
    let own = compiled.get(file)
    if (!own) compiled.set(file, (own = compile(`/dither-kit/${file}`, text)))
    const exports: Record<string, unknown> = {}
    cache.set(file, exports)
    return evaluate(own, (spec) => load(spec, file), META, exports)
  }
  let api: Record<string, unknown> | null = null
  let styles: Record<string, unknown> | null = null
  const load = (spec: string, from?: string): Record<string, unknown> => {
    if (spec in PACKAGES) return PACKAGES[spec]
    if (spec === KIT) {
      if (!fresh) return Kit as unknown as Record<string, unknown>
      if (!api) {
        api = {}
        for (const [name, at] of input.index)
          Object.defineProperty(api, name, { get: () => kitFile(at.file)[at.name], enumerable: true })
      }
      return api
    }
    if (spec.startsWith(`${KIT}/`)) {
      const file = resolveKitFile(`./${spec.slice(KIT.length + 1)}`, input.files)
      if (file) return kitFile(file)
    }
    if (from && spec.startsWith(".")) {
      const file = resolveKitFile(spec, input.files, from)
      if (file) return kitFile(file)
    }
    // The example's own stylesheet: a CSS Module is read as its class names
    // (renamed for this run), a plain one styles this preview only.
    if (!from && input.sheet && spec === `./${input.sheet.file}`) {
      if (styles) return styles
      if (!input.sheet.file.endsWith(".module.css")) {
        css.push(scopeTokens(input.sheet.text, `[${attribute}]`))
        return (styles = {})
      }
      const out = cssModule(input.sheet.text, hashId(`${input.scope}:${input.sheet.file}`))
      css.push(out.css)
      return (styles = { default: out.map })
    }
    throw new Error(
      `Run links "solid-js", "@dither-kit", "@stylexjs/stylex", the example's stylesheet and the kit's own files; "${spec}" is none of them`,
    )
  }
  const component = evaluate(example, (spec) => load(spec), META).default as Component
  if (typeof component !== "function")
    throw new CompileError([
      { file: input.example.path, message: "Nothing to render: the file has no default export." },
    ])
  return {
    component,
    css: [input.tokens ? scopeTokens(input.tokens, `[${attribute}]`) : "", ...css].filter(Boolean).join("\n"),
    attribute,
  }
}
