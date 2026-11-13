// The kit's install, one table: the docs' Quick start shows its steps one at
// a time, the source panel's prompt.md takes them as one script, and the
// landing (which never imports the docs) runs the same commands. A step or a
// package changed in one place fails here until the others follow.
import { describe, expect, it } from "rstack/test"
import { INSTALL, INSTALL_DEPS, INSTALL_STEPS } from "@/pages/docs/install"
import { RUNTIME_DEPS } from "@/pages/landing/facts"

describe("install steps", () => {
  it("give prompt.md the same steps, numbered, as one script", () => {
    INSTALL_STEPS.forEach((step, i) => {
      expect(INSTALL).toContain(`# ${i + 1}. ${step.title}`)
      expect(INSTALL).toContain(step.code)
    })
    expect(INSTALL.split("\n\n# ")).toHaveLength(INSTALL_STEPS.length)
  })

  it("install the packages the kit needs, the landing's too", () => {
    expect(INSTALL_STEPS.map((s) => s.code)).toContain(`npm i ${INSTALL_DEPS.join(" ")}`)
    expect([...RUNTIME_DEPS]).toEqual([...INSTALL_DEPS])
  })

  it("copy the folder the landing copies, and alias it where it lands", () => {
    expect(INSTALL_STEPS[0].code).toBe("npx degit drvova/dither-ui/dither-kit src/dither-kit")
    const alias = INSTALL_STEPS.find((s) => s.title.startsWith("Alias"))?.code ?? ""
    const [, target] = alias.match(/alias: \{ "[^"]+": "([^"]+)" \}/) ?? []
    expect(target).toBeTruthy()
    expect(alias).toContain(`[".${target}"]`)
  })
})
