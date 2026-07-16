// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it } from "vitest"
import { createArtboard } from "../src/entities/artboard/model/factory"
import { editor, selectArtboard } from "../src/entities/editor/model/store"
import Artboard from "../src/widgets/canvas/Artboard.vue"

beforeEach(() => {
  editor.artboards = [createArtboard("button", 10, 20)]
  editor.viewport.zoom = 1
  selectArtboard(editor.artboards[0].id)
})

describe("artboard surface drag", () => {
  it("moves from passive space but leaves controls interactive", () => {
    const wrapper = mount(Artboard, { props: { artboard: editor.artboards[0] } })
    wrapper.get("[data-artboard-surface]").element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: 50, clientY: 50 }))
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 60, clientY: 55 }))
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }))
    expect([editor.artboards[0].x, editor.artboards[0].y]).toEqual([20, 25])

    wrapper.get("button").element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 2, clientX: 60, clientY: 55 }))
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 2, clientX: 80, clientY: 75 }))
    expect([editor.artboards[0].x, editor.artboards[0].y]).toEqual([20, 25])
    wrapper.unmount()
  })
})
