// Docs framework toggle + Vue → Svelte snippet translation.
//
// The Svelte kit (`dither-kit-svelte`) mirrors the Vue kit's surface, so every
// Svelte code tab is derived from the Vue snippet instead of maintaining a
// second snippet corpus — computed picker snippets stay "what you see is what
// you copy" in both frameworks. Export names are parsed from the Svelte kit's
// real index (imported as raw text), so renames in the port propagate here
// without docs maintenance.
import { ref } from "vue"
import svelteKitIndex from "../../../dither-kit-svelte/index.ts?raw"

export type DocsFramework = "vue" | "svelte"

const STORAGE_KEY = "dither-docs-framework"
const canPersist = typeof localStorage !== "undefined"

export const docsFramework = ref<DocsFramework>(
  canPersist && localStorage.getItem(STORAGE_KEY) === "svelte" ? "svelte" : "vue",
)

export function setDocsFramework(next: DocsFramework) {
  docsFramework.value = next
  if (canPersist) localStorage.setItem(STORAGE_KEY, next)
}

// ---- Svelte kit export surface (single source of truth: its index.ts) ------

const SVELTE_EXPORTS: ReadonlySet<string> = (() => {
  const names = new Set<string>()
  for (const m of svelteKitIndex.matchAll(/\bas\s+([A-Za-z][A-Za-z0-9]*)/g)) names.add(m[1])
  for (const m of svelteKitIndex.matchAll(/export\s+\{([^}]*)\}/g)) {
    for (const part of m[1].split(",")) {
      const token = part.trim().replace(/^type\s+/, "")
      const name = token.match(/\bas\s+([A-Za-z0-9]+)$/)?.[1] ?? token
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(name)) names.add(name)
    }
  }
  return names
})()

/** Vue `v-model` targets that are not `value` in the Svelte port. */
const V_MODEL_TARGETS: Record<string, string> = {
  DitherSidebar: "collapsed",
  DitherSidebarSub: "open",
}

const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())

// ---- attribute rewriting ---------------------------------------------------

function eventExpression(raw: string): string {
  const v = raw.trim()
  if (/^[\w$.]+$/.test(v)) return v // bare handler reference
  if (/^\(.*\)\s*=>/s.test(v) || /^[\w$]+\s*=>/.test(v)) return v // already a closure
  if (v.includes(";")) {
    const body = v
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .join("; ")
    return `() => { ${body} }`
  }
  // Assignments read best parenthesized (`() => (open = true)`); calls do not.
  const assigns = /(^|[^=!<>])=([^=>]|$)/.test(v)
  return assigns ? `() => (${v})` : `() => ${v}`
}

// Attribute regions may embed display comments (`<PieChart :data="…" <!-- note -->`)
// in multi-line teaching snippets — consume them whole so the tag end is found.
const TAG_RE = /<([A-Za-z][A-Za-z0-9]*)((?:"[^"]*"|<!--[\s\S]*?-->|[^">])*)>/g
const ATTR_TOKEN = /([@:]?[A-Za-z][\w:.-]*)(="[^"]*"|='[^']*')?/g

function rewriteAttributes(code: string): string {
  return code.replace(TAG_RE, (_, tag: string, attrs: string) => {
    const isComponent = /^[A-Z]/.test(tag)
    const rewritten = attrs.replace(ATTR_TOKEN, (token, name: string, valuePart?: string) => {
      const value = valuePart ? valuePart.slice(2, -1) : undefined
      if (name === "v-model") return `bind:${V_MODEL_TARGETS[tag] ?? "value"}={${value}}`
      if (name.startsWith("v-model:")) return `bind:${camel(name.slice(8))}={${value}}`
      if (name.startsWith("@")) {
        const event = "on" + name.slice(1).replace(/\..*$/, "")
        return `${event}={${eventExpression(value ?? "")}}`
      }
      if (name.startsWith(":")) {
        const bare = name.slice(1)
        const finalName = isComponent && !bare.startsWith("aria-") ? camel(bare) : bare
        return `${finalName}={${value}}`
      }
      if (isComponent && name.includes("-") && !name.startsWith("aria-")) {
        return valuePart ? `${camel(name)}${valuePart}` : camel(name)
      }
      return token
    })
    return `<${tag}${rewritten}>`
  })
}

// ---- element/block structure (v-if, v-for, slots) --------------------------

/** Index of the `>` that ends the tag opened at `from` (quote-aware). */
function findTagEnd(text: string, from: number): number {
  let quote: string | null = null
  for (let i = from; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") {
      quote = c
    } else if (c === ">") {
      return i
    }
  }
  return text.length - 1
}

/** End index (exclusive) of the element whose opening `<` sits at `from`. */
function elementEnd(text: string, from: number, tag: string): number {
  const openEnd = findTagEnd(text, from)
  if (text[openEnd - 1] === "/") return openEnd + 1
  const open = `<${tag}`
  const close = `</${tag}>`
  let depth = 1
  let i = openEnd + 1
  while (i < text.length) {
    if (text.startsWith(close, i)) {
      depth--
      if (depth === 0) return i + close.length
      i += close.length
    } else if (text.startsWith(open, i) && !/[\w-]/.test(text[i + open.length] ?? "")) {
      const e = findTagEnd(text, i)
      if (text[e - 1] !== "/") depth++
      i = e + 1
    } else {
      i++
    }
  }
  return text.length
}

function lineIndent(text: string, at: number): string {
  const lineStart = text.lastIndexOf("\n", at - 1) + 1
  return text.slice(lineStart, at).match(/^\s*/)![0]
}

function eachExpression(expr: string, key?: string): string {
  const m = expr.match(/^\(?\s*([\w$]+)\s*(?:,\s*([\w$]+))?\s*\)?\s+in\s+(.+)$/)
  if (!m) return expr
  const [, alias, index, iterableRaw] = m
  const iterable = iterableRaw.trim()
  const source = /^\d+$/.test(iterable)
    ? `Array.from({ length: ${iterable} }, (_, k) => k + 1)`
    : iterable
  let out = `${source} as ${alias}`
  if (index) out += `, ${index}`
  if (key) out += ` (${key})`
  return out
}

/** Wrap the element carrying v-if/v-for in the matching Svelte block. */
function wrapDirective(code: string, dirIndex: number): string {
  const start = code.lastIndexOf("<", dirIndex)
  const tag = code.slice(start).match(/^<([A-Za-z][A-Za-z0-9]*)/)![1]
  const end = elementEnd(code, start, tag)
  let element = code.slice(start, end)

  const vFor = element.match(/\s*v-for="([^"]+)"/)
  const vIf = element.match(/\s*v-if="([^"]+)"/)
  element = element.replace(/\s*v-(?:if|for)="[^"]*"/, "")
  let key: string | undefined
  if (vFor) {
    const keyMatch = element.match(/\s*:key="([^"]+)"/)
    if (keyMatch) {
      key = keyMatch[1]
      element = element.replace(/\s*:key="[^"]*"/, "")
    }
  }
  const header = vFor ? `{#each ${eachExpression(vFor[1], key)}}` : `{#if ${vIf![1]}}`
  const footer = vFor ? "{/each}" : "{/if}"

  let wrapped: string
  if (element.includes("\n")) {
    const indent = lineIndent(code, start)
    const indented = element
      .split("\n")
      .map((l, i) => (i === 0 || !l.trim() ? l : "  " + l))
      .join("\n")
    wrapped = `${header}\n${indent}  ${indented}\n${indent}${footer}`
  } else {
    wrapped = `${header}${element}${footer}`
  }
  return code.slice(0, start) + wrapped + code.slice(end)
}

/** `<template v-if>` (+ optional sibling `<template v-else>`) → `{#if}{:else}{/if}`. */
function transformTemplateIf(code: string, at: number, condition: string): string {
  const endA = elementEnd(code, at, "template")
  const openEndA = findTagEnd(code, at)
  const innerA = code.slice(openEndA + 1, endA - "</template>".length)

  const tail = code.slice(endA)
  const elseMatch = tail.match(/^\s*<template v-else>/)
  if (elseMatch) {
    const elseStart = endA + tail.indexOf("<template v-else>")
    const endB = elementEnd(code, elseStart, "template")
    const openEndB = findTagEnd(code, elseStart)
    const innerB = code.slice(openEndB + 1, endB - "</template>".length)
    const block = `{#if ${condition}}${innerA}{:else}${innerB}{/if}`
    return code.slice(0, at) + block + code.slice(endB)
  }
  const block = `{#if ${condition}}${innerA}{/if}`
  return code.slice(0, at) + block + code.slice(endA)
}

/** `<template #name>` → `{#snippet name()}` … `{/snippet}`. */
function transformSlot(code: string, at: number, name: string): string {
  const end = elementEnd(code, at, "template")
  const openEnd = findTagEnd(code, at)
  const inner = code.slice(openEnd + 1, end - "</template>".length)
  return code.slice(0, at) + `{#snippet ${camel(name)}()}${inner}{/snippet}` + code.slice(end)
}

function transformBlocks(code: string): string {
  for (let guard = 0; guard < 200; guard++) {
    const slot = code.match(/<template\s+#([\w-]+)>/)
    if (slot) {
      code = transformSlot(code, slot.index!, slot[1])
      continue
    }
    const tplIf = code.match(/<template\s+v-if="([^"]+)">/)
    if (tplIf) {
      code = transformTemplateIf(code, tplIf.index!, tplIf[1])
      continue
    }
    const dir = code.match(/\sv-(?:if|for)="[^"]+"/)
    if (dir) {
      code = wrapDirective(code, dir.index!)
      continue
    }
    return code
  }
  return code
}

// ---- script + module-level rewrites ----------------------------------------

function transformScriptSetup(code: string): string {
  return code.replace(/<script setup[^>]*>\n([\s\S]*?)\n<\/script>/, (_, body: string) => {
    const lines: string[] = []
    for (const raw of body.split("\n")) {
      if (/^\s*import\s[^"]*from "vue"\s*$/.test(raw)) continue
      // Ref unwrapping is a script idiom; `.value` in markup is data access.
      const unwrapped = raw.replace(/\b([A-Za-z_$][\w$]*)\.value\b/g, "$1")
      const line = unwrapped.trim() ? "  " + unwrapped : ""
      if (line === "" && (lines.length === 0 || lines[lines.length - 1] === "")) continue
      lines.push(line)
    }
    while (lines[lines.length - 1] === "") lines.pop()
    return `<script lang="ts">\n${lines.join("\n")}\n</script>`
  })
}

function unwrapTemplate(code: string): string {
  const m = code.match(/(^|\n)<template>\n([\s\S]*?)\n<\/template>\s*$/)
  if (!m) return code
  const inner = m[2]
    .split("\n")
    .map((l) => (l.startsWith("  ") ? l.slice(2) : l))
    .join("\n")
  return code.slice(0, m.index! + m[1].length) + inner
}

function renameComponents(code: string): string {
  for (const name of new Set(code.match(/Dither[A-Z][A-Za-z0-9]*/g) ?? [])) {
    if (SVELTE_EXPORTS.has(name)) continue
    const plain = name.slice("Dither".length)
    if (SVELTE_EXPORTS.has(plain)) code = code.replace(new RegExp(`\\b${name}\\b`, "g"), plain)
  }
  return code
}

/** Translate a Vue docs snippet into its Svelte 5 equivalent. */
export function toSvelteCode(vueCode: string): string {
  let code = transformBlocks(vueCode)
  code = rewriteAttributes(code)
  code = code
    .replace(/\bconst (\w+) = ref(?=[(<])/g, "let $1 = $state")
    .replace(/\bconst (\w+) = reactive\(/g, "let $1 = $state(")
    .replace(/\bconst (\w+) = computed\(\(\) =>\s*/g, "let $1 = $derived(")
    .replace(/"@dither-kit"/g, '"@dither-kit-svelte"')
  code = code.replace(/import \{([^}]*)\} from "@dither-kit-svelte"/g, (all, specs: string) => {
    const names = specs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!names.includes("toast")) return all
    const rest = names.filter((n) => n !== "toast")
    const toastImport = 'import { toast } from "@dither-kit-svelte/runtime/toast.svelte"'
    return rest.length
      ? `import { ${rest.join(", ")} } from "@dither-kit-svelte"\n${toastImport}`
      : toastImport
  })
  code = transformScriptSetup(code)
  code = unwrapTemplate(code)
  code = renameComponents(code)
  code = code.replace(/\{\{\s*([^}]+?)\s*\}\}/g, "{$1}")
  // Residual Vue idioms in teaching comments outside any tag.
  code = code.replace(/:([a-z][a-z0-9-]*)="([^"]*)"/g, (_, name: string, v: string) =>
    `${name.startsWith("aria-") ? name : camel(name)}={${v}}`,
  )
  code = code.replace(/\bv-model\b/g, "bind:value")
  return code
}
