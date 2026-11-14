// @rstest-environment jsdom
// The walk's rules of what assistive technology meets (`walk-checks.mjs`):
// each one on a page of its own here, the way the walk sends it into every
// page it visits. The page scripts are the rules' own source, so they are
// checked to compile as the drivers run them.
import { afterEach, describe, expect, it } from "rstack/test"
import {
  A11Y,
  accessibleName,
  auditA11y,
  changedPixels,
  concealed,
  DIALOG_CLOSED,
  DIALOG_FOCUS,
  DIALOG_KEYS,
  DIALOG_OPENED,
  DIALOG_TABBED,
  dialogFindings,
  FOCUS_ARRIVED,
  FOCUS_BEFORE,
  FOCUS_OFF,
  focusMarks,
  hiddenFocus,
  indicated,
  KEYS_DONE,
  KEYS_END,
  KEYS_READ,
  KEYS_START,
  unreached,
} from "../src/walk-checks.mjs"

/** A page made of `html`. */
const page = (html: string) => {
  document.body.innerHTML = html
  return document
}
const $ = (selector: string) => document.querySelector(selector)!
afterEach(() => {
  document.body.innerHTML = ""
})

describe("an accessible name", () => {
  it("is read as assistive technology reads it: labelledby, label, a field's label, alt, an SVG's title, content", () => {
    page(`
      <span id="a">Saved</span><span id="b">views</span>
      <button id="by" aria-labelledby="a b">x</button>
      <button id="said" aria-label="Close"><svg aria-hidden="true"></svg></button>
      <label for="email">Email</label><input id="email">
      <label>Name <input id="wrapped"></label>
      <button id="img"><img src="x.png" alt="Search"></button>
      <a id="svg" href="/"><svg><title>Home</title></svg></a>
      <button id="text"> Run <span aria-hidden="true">→</span></button>
      <button id="titled" title="Undo"></button>
      <input id="held" placeholder="Search docs">
      <input id="send" type="submit">
      <label><button id="card" role="checkbox"></button> Remember me</label>
      <button id="none"><span aria-hidden="true">x</span></button>`)
    const name = (id: string) => accessibleName($(`#${id}`))
    expect(name("by")).toBe("Saved views")
    expect(name("said")).toBe("Close")
    expect(name("email")).toBe("Email")
    expect(name("wrapped")).toBe("Name")
    expect(name("img")).toBe("Search")
    expect(name("svg")).toBe("Home")
    expect(name("text")).toBe("Run")
    expect(name("titled")).toBe("Undo")
    expect(name("held")).toBe("Search docs")
    expect(name("send")).toBe("Submit")
    // a button is labelable: the card around a checkbox names it
    expect(name("card")).toBe("Remember me")
    expect(name("none")).toBe("")
  })
})

describe("what assistive technology passes by", () => {
  it("is what aria-hidden, inert, hidden or a closed dialog holds, or what is not rendered", () => {
    page(`
      <div aria-hidden="true"><button id="a">a</button></div>
      <div inert><button id="b">b</button></div>
      <p hidden id="c">c</p>
      <dialog><button id="d">d</button></dialog>
      <div style="display: none"><span id="e">e</span></div>
      <div style="display: contents"><button id="f">f</button></div>`)
    expect(["a", "b", "c", "d", "e"].map((id) => concealed($(`#${id}`)))).toEqual([true, true, true, true, true])
    expect(concealed($("#f"))).toBe(false)
  })
})

describe("the page as a screen reader reads it", () => {
  it("names every operable element", () => {
    const out = auditA11y(
      page(`<main><h1>T</h1><button aria-label="Close"></button><button class="x"></button></main>`),
    )
    expect(out.names).toEqual(["page: <button.x>"])
  })

  it("holds each id once, and every id a reference names", () => {
    const out = auditA11y(
      page(`<main><h1>T</h1>
        <p id="twice"></p><p id="twice"></p>
        <button aria-controls="gone">a</button>
        <button aria-expanded="false" aria-controls="later">b</button>
        <button aria-describedby="twice">c</button>
        <label for="nowhere">d</label></main>`),
    )
    expect(out.ids).toEqual(["#twice on 2 elements"])
    // a collapsed key may name the popup it has not opened yet
    expect(out.refs).toEqual([
      'page: <button> "a" aria-controls="gone": no such id',
      'page: <label> "d" for="nowhere": no such id',
    ])
  })

  it("has one h1 and skips no level going down inside main", () => {
    expect(auditA11y(page(`<h2>a</h2><main><h4>b</h4></main>`)).headings).toEqual([
      "0 h1",
      'h2 then h4: page: <h4> "b"',
    ])
    expect(
      auditA11y(page(`<main><h1>a</h1><h2>b</h2><h3>c</h3><h2>d</h2></main><footer><h4>e</h4></footer>`)).headings,
    ).toEqual([])
    expect(auditA11y(page(`<main><h1>a</h1><div role="heading" aria-level="1">b</div></main>`)).headings).toEqual([
      '2 h1: "a", "b"',
    ])
  })

  it("has one main, and names each landmark of a kind there are several of", () => {
    const out = auditA11y(
      page(`<header>top</header><nav aria-label="Site"></nav><nav></nav><aside aria-label="Sections"></aside>
        <main><h1>T</h1><main>inner</main><article><header>its own</header></article>
          <div data-demo-card><nav aria-label="Breadcrumb"></nav></div><div data-demo-card><nav aria-label="Breadcrumb"></nav></div>
          <div role="none"><main role="none">no landmark</main></div></main>
        <aside aria-label="Sections"></aside>`),
    )
    expect(out.landmarks).toEqual([
      "2 main landmarks",
      "4 navigation landmarks, this one unnamed: rail: <nav>",
      'two complementary landmarks named "sections": rail: <aside> "Sections"',
    ])
    // a header inside an article is no banner
    expect(out.counts.banner).toBe(1)
  })

  it("gives every image a text, or hides it", () => {
    const out = auditA11y(
      page(`<main><h1>T</h1><img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="Logo">
        <svg role="img"></svg><svg role="img" aria-label="Chart"></svg><canvas role="img"></canvas>
        <div aria-hidden="true"><img src="d.png"></div></main>`),
    )
    expect(out.images).toEqual(["page: <img>", "page: <svg role=img>", "page: <canvas role=img>"])
  })
})

describe("focus as a keyboard meets it", () => {
  it("shows a mark: any of the element's own style, its boxes' around it or its pseudo-elements changing", () => {
    page(`<div class="wrap"><button id="k">Key</button></div>`)
    const key = $("#k")
    const before = focusMarks(key)
    expect(indicated(before, focusMarks(key))).toBe(false)
    ;(key.parentElement as HTMLElement).style.boxShadow = "0 0 0 1px white"
    expect(indicated(before, focusMarks(key))).toBe(true)
  })

  it("never lands where a reader cannot see it or is not told of it", () => {
    page(`<div aria-hidden="true"><button id="a">a</button></div><div inert><button id="b">b</button></div>
      <button id="c" style="visibility: hidden">c</button><button id="d">d</button>`)
    expect(["a", "b", "c", "d"].map((id) => hiddenFocus($(`#${id}`)))).toEqual([
      "under aria-hidden",
      "inside inert",
      "not rendered",
      "",
    ])
  })

  it("reaches every stop; a widget's one stop stands for the members it keeps out of the tab order", () => {
    const stops = [
      { key: 0 },
      { key: 1, roving: "tabs", out: false },
      { key: 2, roving: "tabs", out: true },
      { key: 3, roving: "list", out: true },
      { key: 4, roving: "group", out: false },
      { key: 5 },
    ]
    // the listbox itself took focus, holding its options by aria-activedescendant
    expect(unreached(stops, [0, 1], ["list"]).map((s) => s.key)).toEqual([4, 5])
  })

  it("judges a dialog by the keyboard: in as it opens, kept in while modal, out on Escape, back on its key", () => {
    const fine = {
      opener: "Open",
      opened: true,
      focusIn: true,
      named: true,
      modal: true,
      escaped: [],
      closed: true,
      returned: true,
    }
    expect(dialogFindings(fine)).toEqual([])
    expect(dialogFindings({ opener: "Open", opened: false })).toEqual(["Open: Enter opened no dialog"])
    expect(
      dialogFindings({
        ...fine,
        focusIn: false,
        focusAt: "page: <a>",
        named: false,
        escaped: ["page: <a>"],
        returned: false,
      }),
    ).toEqual([
      "Open: focus stayed outside the dialog as it opened (on page: <a>)",
      "Open: the dialog has no name",
      "Open: Tab left the modal dialog for page: <a>",
      "Open: focus did not return to the key that opened it (on the page)",
    ])
    expect(dialogFindings({ ...fine, closed: false })).toEqual(["Open: Escape left the dialog open"])
    // a dialog that is not modal may let Tab out
    expect(dialogFindings({ ...fine, modal: false, escaped: ["page: <a>"] })).toEqual([])
  })

  it("counts the pixels a mark changes in a box, by enough to see", () => {
    const shot = (fill: number) => ({ width: 4, height: 4, data: new Uint8Array(64).fill(fill) })
    const ringed = shot(0)
    for (const o of [0, 4, 8]) ringed.data[o] = 200
    expect(changedPixels(shot(0), ringed, [0, 0, 2, 2], 2)).toBe(3)
    expect(changedPixels(shot(0), shot(30), [0, 0, 2, 2], 2)).toBe(0)
  })
})

describe("the page scripts", () => {
  it("compile as the drivers run them: the body of an async function given arg", () => {
    for (const body of [
      A11Y,
      KEYS_START,
      KEYS_READ,
      KEYS_END,
      KEYS_DONE,
      FOCUS_BEFORE,
      FOCUS_ARRIVED,
      FOCUS_OFF,
      DIALOG_KEYS,
      DIALOG_FOCUS,
      DIALOG_OPENED,
      DIALOG_TABBED,
      DIALOG_CLOSED,
    ])
      expect(() => new Function("arg", `return (async()=>{${body}\n})()`)).not.toThrow()
  })
})
