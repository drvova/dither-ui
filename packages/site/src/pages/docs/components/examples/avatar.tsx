import { DitherAvatar } from "@dither-kit"

export default function Example(props: { name?: string }) {
  return (
    <div class="flex items-end justify-center gap-3">
      {/* same name, same face, at any size */}
      <DitherAvatar name={props.name ?? "ada"} size={24} />
      <DitherAvatar name={props.name ?? "ada"} size={32} />
      <DitherAvatar name={props.name ?? "ada"} size={48} />
      <DitherAvatar name={props.name ?? "ada"} size={64} />
    </div>
  )
}
