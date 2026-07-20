// Svelte action replacing Vue's <Teleport to="body">. Moves the node to the
// target (body by default) on mount and removes it on destroy. Svelte plays any
// out-transition before calling destroy, so the node stays in place until the
// leave animation completes, then is removed.

export function portal(node: HTMLElement, target: HTMLElement | string = document.body) {
  const to = typeof target === "string" ? document.querySelector(target) : target
  to?.appendChild(node)
  return {
    destroy() {
      node.remove()
    },
  }
}
