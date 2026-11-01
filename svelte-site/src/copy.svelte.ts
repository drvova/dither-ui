// A copy key's state: `copy(text)` writes it to the clipboard and `copied`
// holds for `ms` after a write lands, so the key can say so. One helper for
// every copy key on this site (the docs' code blocks, the landing's
// install), so they all behave alike.
export function copier(ms = 1400) {
  let copied = $state(false)
  let timer = 0
  return {
    get copied() {
      return copied
    },
    async copy(text: string) {
      try {
        await navigator.clipboard.writeText(text)
        copied = true
        clearTimeout(timer)
        timer = window.setTimeout(() => (copied = false), ms)
      } catch {
        copied = false
      }
    },
  }
}
