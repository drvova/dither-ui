import { describe, expect, it } from "rstack/test"
import { createWidget } from "../src/entities/widget/model/factory"

describe("widget factory", () => {
  it("creates each kind with its discriminant", () => {
    expect(createWidget("avatar").kind).toBe("avatar")
    expect(createWidget("button").kind).toBe("button")
    expect(createWidget("gradient").kind).toBe("gradient")
  })
})
