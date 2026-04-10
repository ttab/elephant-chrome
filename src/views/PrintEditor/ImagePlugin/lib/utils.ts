// Parse crop string to {x, y, w, h} object (or null)
export const parseCropString = (crop: string | undefined): { x: number, y: number, w: number, h: number } | null => {
  return crop
    ? (() => {
        const parts = crop.split(' ').map(parseFloat)
        return parts.length === 4 ? { x: parts[0], y: parts[1], w: parts[2], h: parts[3] } : null
      })()
    : null
}

// Parse focus string to {x, y} object (or null)
export const parseFocusString = (focus: string | undefined): { x: number, y: number } | null => {
  return focus
    ? (() => {
        const parts = focus.split(' ').map(parseFloat)
        return parts.length === 2 ? { x: parts[0], y: parts[1] } : null
      })()
    : null
}
