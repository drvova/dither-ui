// The agent's replies as the composer sets them: the Markdown a harness
// writes (headings, paragraphs, lists, fenced code, inline code, bold) read
// into blocks the panel renders as elements, never as HTML, so a reply can
// carry nothing that runs. Safe on a partial stream: an unclosed fence is
// code to the end, an unclosed mark is plain text.

export type Inline = { kind: "text" | "code" | "strong"; text: string }
export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; inline: Inline[] }
  | { kind: "paragraph"; inline: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "code"; lang: string; text: string }

/** One line's marks: `code` spans first (nothing inside them is a mark),
 * then **bold**; a link keeps its words. */
export function inline(text: string): Inline[] {
  const out: Inline[] = []
  const words = (t: string) => {
    const parts = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1").split(/\*\*([^*]+)\*\*/g)
    parts.forEach((p, i) => p && out.push({ kind: i % 2 ? "strong" : "text", text: p }))
  }
  const parts = text.split(/`([^`]+)`/g)
  parts.forEach((p, i) => (i % 2 ? out.push({ kind: "code", text: p }) : words(p)))
  return out
}

const HEADING = /^(#{1,6})\s+(.*)$/
const ITEM = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/
const FENCE = /^\s*```\s*([\w-]*)/

export function parseProse(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  let para: string[] = []
  const endPara = () => {
    if (para.length) blocks.push({ kind: "paragraph", inline: inline(para.join(" ")) })
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = FENCE.exec(line)
    if (fence) {
      endPara()
      const code: string[] = []
      while (++i < lines.length && !FENCE.test(lines[i])) code.push(lines[i])
      blocks.push({ kind: "code", lang: fence[1], text: code.join("\n") })
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      endPara()
      const level = Math.min(3, heading[1].length) as 1 | 2 | 3
      blocks.push({ kind: "heading", level, inline: inline(heading[2]) })
      continue
    }
    const item = ITEM.exec(line)
    if (item) {
      endPara()
      const ordered = !item[1]
      const last = blocks[blocks.length - 1]
      if (last?.kind === "list" && last.ordered === ordered) last.items.push(inline(item[3]))
      else blocks.push({ kind: "list", ordered, items: [inline(item[3])] })
      continue
    }
    if (!line.trim()) endPara()
    else para.push(line.trim())
  }
  endPara()
  return blocks
}
