export function decodeString(text: string) {
  if (!text) {
    return ''
  }

  const doc = new DOMParser().parseFromString(text, 'text/html')
  return doc.documentElement.textContent
}
