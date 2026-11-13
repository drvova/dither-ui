// A page's head, rendered from the one table (`heads.ts`), and the root's
// `data-page` marker the pages' grounds key on (the server sets it in the
// bytes, `entry-server.tsx`; a move between pages sets it here).
import { Link, Meta, Title, useHead } from "@solidjs/meta"
import { createUniqueId, For, type JSX, onCleanup, onMount } from "solid-js"
import type { HeadTag } from "@/pages/docs/share-cards"
import type { RouteName } from "@/shared/config/titles"
import { pageTags } from "./heads"

/** A script of the head (structured data), its text safe inside the tag. */
function HeadScript(props: { attrs: Record<string, string>; text: string }) {
  useHead({
    tag: "script",
    id: createUniqueId(),
    setting: { close: true },
    // a `<` never opens a tag inside the script
    props: { ...props.attrs, children: props.text.replace(/</g, "\\u003c") },
  })
  return null
}

function Tag(props: { tag: HeadTag }): JSX.Element {
  const t = props.tag
  if (t.tag === "title") return <Title>{t.text}</Title>
  if (t.tag === "script") return <HeadScript attrs={t.attrs} text={t.text} />
  return t.tag === "meta" ? <Meta {...t.attrs} /> : <Link {...t.attrs} />
}

export default function PageHead(props: {
  page: RouteName
  /** The docs section the page shows, when it shows one. */
  section?: string
}) {
  onMount(() => {
    const root = document.documentElement
    const page = props.page
    root.dataset.page = page
    onCleanup(() => {
      if (root.dataset.page === page) delete root.dataset.page
    })
  })
  return <For each={pageTags(props.page, props.section)}>{(t) => <Tag tag={t} />}</For>
}
