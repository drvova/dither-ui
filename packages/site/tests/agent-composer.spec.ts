// The agent panel as a composer: the reply set as prose from the Markdown a
// harness writes (never as HTML), each Studio tool call a step in words with
// the frames it changed, and the checkpoint each message keeps, restored as
// one undoable step.
import { describe, expect, it } from "rstack/test"
import { inline, parseProse } from "@/widgets/agent/model/prose"

describe("the reply as prose", () => {
  it("reads headings, paragraphs, lists and fenced code into blocks", () => {
    const blocks = parseProse(
      "## Plan\nI added a **sign-in** screen\nwith `DitherInput`.\n\n- email\n- password\n1. one\n2) two\n```vue\n<DitherButton />\n```",
    )
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "paragraph", "list", "list", "code"])
    expect(blocks[0]).toEqual({ kind: "heading", level: 2, inline: [{ kind: "text", text: "Plan" }] })
    // A paragraph's lines join; its marks become spans.
    expect(blocks[1]).toEqual({
      kind: "paragraph",
      inline: [
        { kind: "text", text: "I added a " },
        { kind: "strong", text: "sign-in" },
        { kind: "text", text: " screen with " },
        { kind: "code", text: "DitherInput" },
        { kind: "text", text: "." },
      ],
    })
    expect(blocks[2]).toMatchObject({
      kind: "list",
      ordered: false,
      items: [[{ text: "email" }], [{ text: "password" }]],
    })
    expect(blocks[3]).toMatchObject({ kind: "list", ordered: true })
    expect(blocks[4]).toEqual({ kind: "code", lang: "vue", text: "<DitherButton />" })
  })

  it("is safe on a partial stream: an open fence is code to the end, an open mark is text", () => {
    expect(parseProse("Here:\n```ts\nconst a = 1")).toEqual([
      { kind: "paragraph", inline: [{ kind: "text", text: "Here:" }] },
      { kind: "code", lang: "ts", text: "const a = 1" },
    ])
    expect(inline("half **bold and `half code")).toEqual([{ kind: "text", text: "half **bold and `half code" }])
  })

  it("keeps markup as text and a link as its words", () => {
    expect(inline('<img src=x onerror="alert(1)"> [the docs](https://x.y)')).toEqual([
      { kind: "text", text: '<img src=x onerror="alert(1)"> the docs' },
    ])
    // Nothing inside a code span is a mark.
    expect(inline("`**not bold**`")).toEqual([{ kind: "code", text: "**not bold**" }])
  })
})
