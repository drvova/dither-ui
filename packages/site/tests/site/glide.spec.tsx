// The glide (`shared/lib/glide.ts`): one ground under the pointer, placed at
// once on the first entry and travelling from there, gone when the pointer
// leaves, never driven by a finger.
import { afterEach, describe, expect, it } from "vitest"
import { glide, glideBox } from "@/shared/lib/glide"

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect

function row() {
  const host = document.createElement("nav")
  host.getBoundingClientRect = () => rect(100, 20, 300, 32)
  const links = [0, 1].map((i) => {
    const a = document.createElement("a")
    a.href = `#${i}`
    a.textContent = `link ${i}`
    a.getBoundingClientRect = () => rect(100 + i * 80, 20, 60 + i * 10, 32)
    host.append(a)
    return a
  })
  document.body.append(host)
  return { host, links, g: glide(host), ground: () => host.querySelector<HTMLElement>(".glide-ground")! }
}

const point = (el: Element, pointerType = "mouse") =>
  el.dispatchEvent(Object.assign(new Event("pointerover", { bubbles: true }), { pointerType }))

afterEach(() => (document.body.innerHTML = ""))

describe("the glide", () => {
  it("measures the ground in the host's coordinates", () => {
    expect(glideBox(rect(100, 20, 300, 32), rect(180, 24, 70, 24))).toEqual({ x: 80, y: 4, width: 70, height: 24 })
  })

  it("stands under the pointed link, placed at once, then travels", () => {
    const { links, ground } = row()
    expect(ground().getAttribute("aria-hidden")).toBe("true")
    point(links[1])
    expect(ground().classList.contains("is-shown")).toBe(true)
    expect(ground().style.transform).toBe("translate3d(80px, 0px, 0)")
    expect(ground().style.width).toBe("70px")
    // Placed, not travelling in: the class that drops the travel is gone again after the reflow.
    expect(ground().classList.contains("is-placed")).toBe(false)
    point(links[0].firstChild!.parentElement!)
    expect(ground().style.transform).toBe("translate3d(0px, 0px, 0)")
    expect(ground().style.width).toBe("60px")
  })

  it("fades when the pointer leaves, and a finger never drives it", () => {
    const { host, links, ground } = row()
    point(links[0], "touch")
    expect(ground().classList.contains("is-shown")).toBe(false)
    point(links[0])
    host.dispatchEvent(new Event("pointerleave"))
    expect(ground().classList.contains("is-shown")).toBe(false)
  })

  it("lets go of the host", () => {
    const { host, g } = row()
    g.destroy()
    expect(host.querySelector(".glide-ground")).toBeNull()
    expect(host.classList.contains("glide-host")).toBe(false)
  })
})
