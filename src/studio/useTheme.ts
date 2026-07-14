import { onMounted, ref } from "vue"

/** Dark/light toggle on <html>. Defaults to dark (the dither aesthetic). */
export function useTheme() {
  const dark = ref(true)
  const apply = () =>
    document.documentElement.classList.toggle("dark", dark.value)
  const toggle = () => {
    dark.value = !dark.value
    apply()
  }
  onMounted(apply)
  return { dark, toggle }
}
