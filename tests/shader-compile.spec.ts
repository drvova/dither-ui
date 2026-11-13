// A shader's program compiles in the background (`gl.ts` `startProgram`,
// `programReady`, `finishProgram`): asking how a compile went waited on the
// GPU driver until it was done, the largest main-thread stall left on the
// landing. A fake WebGL2 whose driver finishes compiling when the test says.
import { describe, expect, it } from "rstack/test"
import { buildProgram, finishProgram, programReady, startProgram } from "../dither-kit/engine/gl"
import { fakeGl } from "./fake-gl"

describe("starting a program", () => {
  it("never asks how the compile went, so it never waits", () => {
    const fake = fakeGl()
    const started = startProgram(fake.gl, "v", "f", ["p"])
    expect(typeof started).toBe("object")
    expect(fake.state.waits).toBe(0)
    if (typeof started === "string") return
    expect(programReady(fake.gl, started)).toBe(false)
    expect(fake.state.waits).toBe(0)
    fake.finish()
    expect(programReady(fake.gl, started)).toBe(true)
    expect(typeof finishProgram(fake.gl, started)).toBe("object")
  })

  it("is ready at once where the driver cannot say, collected the only way there is", () => {
    const fake = fakeGl({ parallel: false })
    const started = startProgram(fake.gl, "v", "f")
    if (typeof started === "string") throw new Error(started)
    expect(programReady(fake.gl, started)).toBe(true)
  })

  it("reports the compiler's first line as building at once did: fragment, vertex, then link", () => {
    expect(buildProgram(fakeGl({ broken: "fragment" }).gl, "v", "f")).toBe("fragment: bad")
    expect(buildProgram(fakeGl({ broken: "vertex" }).gl, "v", "f")).toBe("vertex: bad")
    expect(buildProgram(fakeGl({ broken: "link" }).gl, "v", "f")).toBe("link: bad")
  })
})
