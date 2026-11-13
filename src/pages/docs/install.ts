// The kit's install steps per framework: the docs' Quick start shows them
// one step at a time (each its own copy), the source panel's prompt.md takes
// them as one commented script, and (kept in sync by hand, it never imports
// the docs) the landing's InstallBlock runs the same commands.

export type InstallKind = "solid" | "svelte"

/** One step: what it does, why where a reader would ask, and its code. */
export type InstallStep = { title: string; why?: string; code: string }

/** The packages the kit needs beside the framework, per install. */
export const INSTALL_DEPS: Record<InstallKind, readonly string[]> = {
  solid: ["d3-scale", "d3-shape", "clsx", "tailwind-merge"],
  svelte: ["d3-scale", "d3-shape", "clsx", "tailwind-merge"],
}

const copy = (folder: string): InstallStep => ({
  title: "Copy the kit folder straight from the repo",
  why: "degit grabs just the folder",
  code: `npx degit drvova/dither-ui/${folder} src/${folder}`,
})

const deps = (kind: InstallKind, already: string): InstallStep => ({
  title: "Install the runtime deps",
  why: already,
  code: `npm i ${INSTALL_DEPS[kind].join(" ")}`,
})

const alias = (name: string, target: string): InstallStep => ({
  title: `Alias ${name} so imports stay clean`,
  code: `// vite.config.ts
resolve: { alias: { "${name}": "${target}" } }

// tsconfig.json, under compilerOptions
"paths": { "${name}": [".${target}"] }`,
})

export const INSTALL_STEPS: Record<InstallKind, readonly InstallStep[]> = {
  solid: [
    copy("dither-kit"),
    deps("solid", "you already have Solid, and Tailwind if you use it"),
    alias("@dither-kit", "/src/dither-kit/solid"),
    { title: "Use it", code: `import { AreaChart, Area, DitherButton } from "@dither-kit"` },
  ],
  svelte: [
    copy("dither-kit-svelte"),
    deps("svelte", "you already have Svelte 5, and Tailwind if you use it"),
    alias("@dither-kit-svelte", "/src/dither-kit-svelte"),
    { title: "Use it", code: `import { AreaChart, Area, DitherButton } from "@dither-kit-svelte"` },
  ],
}

/** The steps as one commented script, numbered, for a reader who takes them whole. */
export const installScript = (steps: readonly InstallStep[]): string =>
  steps.map((s, i) => `# ${i + 1}. ${s.title}${s.why ? ` (${s.why})` : ""}\n${s.code}`).join("\n\n")

export const INSTALL: Record<InstallKind, string> = {
  solid: installScript(INSTALL_STEPS.solid),
  svelte: installScript(INSTALL_STEPS.svelte),
}
