// The kit's install, one table: the docs' Quick start shows its steps one at
// a time, the source panel's prompt.md takes them as one script, and the
// landing (which never imports the docs) runs the same commands. A step or a
// package changed in one place fails here until the others follow.
import { describe, expect, it } from "rstack/test"
import { INSTALL, INSTALL_DEPS, INSTALL_STEPS, installScript } from "@/pages/docs/install"
import { RUNTIME_DEPS } from "@/pages/landing/facts"

describe("install steps", () => {
  it("give prompt.md the same steps, numbered, as one script", () => {
    for (const kind of ["solid", "svelte"] as const) {
      expect(INSTALL[kind]).toBe(installScript(INSTALL_STEPS[kind]))
      INSTALL_STEPS[kind].forEach((step, i) => {
        expect(INSTALL[kind]).toContain(`# ${i + 1}. ${step.title}`)
        expect(INSTALL[kind]).toContain(step.code)
      })
    }
  })

  it("install the packages each kind needs, and the landing the Solid kit's", () => {
    for (const kind of ["solid", "svelte"] as const)
      expect(INSTALL_STEPS[kind].map((s) => s.code)).toContain(`npm i ${INSTALL_DEPS[kind].join(" ")}`)
    expect([...RUNTIME_DEPS]).toEqual([...INSTALL_DEPS.solid])
  })

  it("copy the folder the landing copies, and alias it where it lands", () => {
    expect(INSTALL_STEPS.solid[0].code).toBe("npx degit drvova/dither-ui/dither-kit src/dither-kit")
    expect(INSTALL_STEPS.svelte[0].code).toBe("npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte")
    for (const kind of ["solid", "svelte"] as const) {
      const alias = INSTALL_STEPS[kind].find((s) => s.title.startsWith("Alias"))?.code ?? ""
      const [, target] = alias.match(/alias: \{ "[^"]+": "([^"]+)" \}/) ?? []
      expect(target).toBeTruthy()
      expect(alias).toContain(`["${"."}${target}"]`)
    }
  })
})
