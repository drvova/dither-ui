// The runtime half of Run: compiled files evaluated against the page's own
// Vue (so the result mounts inside the docs app). An example that only
// edits itself links to the page's kit, the very modules the docs run on.
// Once a kit file is edited, the example links to a kit evaluated from its
// source instead — the edited files and everything they and the example
// reach — so a compound component and its contexts (chart, series, field,
// drawer) share one consistent set of modules. Loaded with the compiler on
// the first Run.
import {
  BaseTransition,
  camelize,
  capitalize,
  cloneVNode,
  Comment,
  type Component,
  computed,
  createBlock,
  createCommentVNode,
  createElementBlock,
  createElementVNode,
  // @ts-expect-error -- exported for compiled SFCs, kept out of the d.ts
  createPropsRestProxy,
  createSlots,
  createStaticVNode,
  createTextVNode,
  createVNode,
  customRef,
  defineAsyncComponent,
  defineComponent,
  EffectScope,
  effectScope,
  Fragment,
  getCurrentInstance,
  getCurrentScope,
  guardReactiveProps,
  h,
  inject,
  isMemoSame,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  isShallow,
  isVNode,
  markRaw,
  // @ts-expect-error -- exported for compiled SFCs, kept out of the d.ts
  mergeDefaults,
  // @ts-expect-error -- exported for compiled SFCs, kept out of the d.ts
  mergeModels,
  mergeProps,
  nextTick,
  normalizeClass,
  normalizeProps,
  normalizeStyle,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onScopeDispose,
  onUnmounted,
  onUpdated,
  onWatcherCleanup,
  openBlock,
  popScopeId,
  provide,
  pushScopeId,
  reactive,
  readonly,
  ref,
  renderList,
  renderSlot,
  resolveComponent,
  resolveDirective,
  resolveDynamicComponent,
  setBlockTracking,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  Static,
  Teleport,
  Text,
  toDisplayString,
  toHandlerKey,
  toHandlers,
  toRaw,
  toRef,
  toRefs,
  toValue,
  Transition,
  TransitionGroup,
  triggerRef,
  unref,
  useAttrs,
  useCssModule,
  useCssVars,
  useId,
  useModel,
  useSlots,
  useTemplateRef,
  vModelCheckbox,
  vModelDynamic,
  vModelRadio,
  vModelSelect,
  vModelText,
  vShow,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  // @ts-expect-error -- exported for compiled SFCs, kept out of the d.ts
  withAsyncContext,
  withCtx,
  withDirectives,
  withKeys,
  withMemo,
  withModifiers,
  withScopeId,
} from "vue"
import {
  CompileError,
  compileModule,
  compileVue,
  evaluate,
  hashId,
  scopeTokens,
  type Compiled,
  type Problem,
} from "./compile"
import * as Kit from "@dither-kit"
import { clsx } from "clsx"
import { scaleBand, scaleLinear, scalePoint } from "d3-scale"
import { stack, stackOffsetExpand } from "d3-shape"
import { twMerge } from "tailwind-merge"
import { kitFilesOf, resolveKitFile } from "./files"
import * as StyleX from "./stylex"

// Vue as a component's code sees it: everything a template compiles to and a
// script can call — not the app, SSR, hydration or custom-element builders,
// which a namespace import would keep in every page's Vue chunk.
const VUE: Record<string, unknown> = {
  BaseTransition,
  camelize,
  capitalize,
  cloneVNode,
  Comment,
  computed,
  createBlock,
  createCommentVNode,
  createElementBlock,
  createElementVNode,
  createPropsRestProxy,
  createSlots,
  createStaticVNode,
  createTextVNode,
  createVNode,
  customRef,
  defineAsyncComponent,
  defineComponent,
  EffectScope,
  effectScope,
  Fragment,
  getCurrentInstance,
  getCurrentScope,
  guardReactiveProps,
  h,
  inject,
  isMemoSame,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  isShallow,
  isVNode,
  markRaw,
  mergeDefaults,
  mergeModels,
  mergeProps,
  nextTick,
  normalizeClass,
  normalizeProps,
  normalizeStyle,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onScopeDispose,
  onUnmounted,
  onUpdated,
  onWatcherCleanup,
  openBlock,
  popScopeId,
  provide,
  pushScopeId,
  reactive,
  readonly,
  ref,
  renderList,
  renderSlot,
  resolveComponent,
  resolveDirective,
  resolveDynamicComponent,
  setBlockTracking,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  Static,
  Teleport,
  Text,
  toDisplayString,
  toHandlerKey,
  toHandlers,
  toRaw,
  toRef,
  toRefs,
  toValue,
  Transition,
  TransitionGroup,
  triggerRef,
  unref,
  useAttrs,
  useCssModule,
  useCssVars,
  useId,
  useModel,
  useSlots,
  useTemplateRef,
  vModelCheckbox,
  vModelDynamic,
  vModelRadio,
  vModelSelect,
  vModelText,
  vShow,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  withAsyncContext,
  withCtx,
  withDirectives,
  withKeys,
  withMemo,
  withModifiers,
  withScopeId,
}

// The packages the kit's own files import (tests/source.spec.ts holds this
// list to every import in the kit).
export const PACKAGES: Record<string, Record<string, unknown>> = {
  // StyleX done at run time (see stylex.ts): what an app's bundler plugin compiles.
  "@stylexjs/stylex": StyleX,
  clsx: { clsx },
  "d3-scale": { scaleBand, scaleLinear, scalePoint },
  "d3-shape": { stack, stackOffsetExpand },
  "tailwind-merge": { twMerge },
}

export const VUE_NAMES = (): string[] => Object.keys(VUE)

const META = { env: { DEV: import.meta.env.DEV, PROD: import.meta.env.PROD, MODE: import.meta.env.MODE } }
const IMPORTS = /\b(?:from|import)\s*["'](\.[^"']+)["']/g

export interface RunInput {
  /** The card the run belongs to (scope ids, the tokens' scope). */
  scope: string
  example: { path: string; text: string }
  /** Edited kit files, by their path inside the kit. */
  kit: { file: string; text: string }[]
  /** The edited tokens stylesheet, if it was edited. */
  tokens?: string
  /** The kit's public exports (`kitIndex`) and its file list. */
  index: Map<string, { file: string; name: string }>
  files: readonly string[]
  /** A kit file's original text (for the types `defineProps` reads). */
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
  const edited = new Map(input.kit.map((f) => [f.file, f.text]))
  const fresh = edited.size > 0
  // The kit files the run reaches — from the edited files and, for a kit
  // evaluated from source, from what the example imports — read up front:
  // the compiler resolves types and the linker evaluates synchronously.
  const texts = new Map(edited)
  let wave = [...edited.keys(), ...(fresh ? kitFilesOf(input.example.text, "vue", input.index, input.files) : [])]
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
  const fs = {
    fileExists: (f: string) => texts.has(f.replace(/^\/dither-kit\//, "")),
    readFile: (f: string) => texts.get(f.replace(/^\/dither-kit\//, "")),
  }
  const compile = (file: string, text: string) =>
    file.endsWith(".vue")
      ? compileVue(`/dither-kit/${file}`, text, { id: hashId(`${input.scope}:${file}`), fs })
      : compileModule(`/dither-kit/${file}`, text)

  const problems: Problem[] = []
  const attempt = (fn: () => Compiled): Compiled | undefined => {
    try {
      return fn()
    } catch (e) {
      if (!(e instanceof CompileError)) throw e
      problems.push(...e.problems)
    }
  }
  const compiled = new Map<string, Compiled>()
  for (const [file, text] of edited) {
    const out = attempt(() => compile(file, text))
    if (out) compiled.set(file, out)
  }
  const example = attempt(() =>
    compileVue(input.example.path, input.example.text, { id: hashId(`${input.scope}:${input.example.path}`) }),
  )
  if (problems.length || !example) throw new CompileError(problems)

  // The kit from source: each file compiled and evaluated the first time
  // something imports it.
  const cache = new Map<string, Record<string, unknown> | null>()
  const kitFile = (file: string): Record<string, unknown> => {
    const hit = cache.get(file)
    if (hit) return hit
    if (hit === null) throw new Error(`Run can't link the import cycle through the kit's ${file}`)
    let own = compiled.get(file)
    if (!own) {
      const text = texts.get(file)
      if (text === undefined) throw new Error(`Run couldn't read the kit's ${file}`)
      compiled.set(file, (own = compile(file, text)))
    }
    cache.set(file, null)
    const mod = evaluate(own, (spec) => load(spec, file), META)
    cache.set(file, mod)
    return mod
  }
  let api: Record<string, unknown> | null = null
  const load = (spec: string, from?: string): Record<string, unknown> => {
    if (spec === "vue") return VUE
    if (spec in PACKAGES) return PACKAGES[spec]
    if (spec === "@dither-kit") {
      if (!fresh) return Kit as unknown as Record<string, unknown>
      if (!api) {
        api = {}
        for (const [name, at] of input.index)
          Object.defineProperty(api, name, { get: () => kitFile(at.file)[at.name], enumerable: true })
      }
      return api
    }
    if (from && spec.startsWith(".")) {
      const file = resolveKitFile(spec, input.files, from)
      if (file) return kitFile(file)
    }
    throw new Error(
      `Run links "vue", "@dither-kit", "@stylexjs/stylex" and the kit's own files; "${spec}" is none of them`,
    )
  }
  const component = evaluate(example, (spec) => load(spec), META).default as Component
  const attribute = `data-run-${hashId(input.scope)}`
  const css = [
    input.tokens ? scopeTokens(input.tokens, `[${attribute}]`) : "",
    ...[...compiled.values()].flatMap((c) => c.css),
    ...example.css,
  ]
    .filter(Boolean)
    .join("\n")
  return { component, css, attribute }
}
