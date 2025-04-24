export function decodeString(text: string) {
  if (!text) {
    return ''
  }

  try {
    text = decodeURIComponent(text)
  } catch (e) {
    console.error('Failed to decode URI component:', e)
  }

  const doc = new DOMParser().parseFromString(text, 'text/html')
  return doc.documentElement.textContent || ''
}
