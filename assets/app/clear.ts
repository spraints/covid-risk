export default function clear(el: Element) {
  while (el.lastChild) el.removeChild(el.lastChild)
}
