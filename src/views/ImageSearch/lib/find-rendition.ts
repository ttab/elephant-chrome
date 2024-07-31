export interface rendition {
  usage: string
  variant: string
  href: string
  mimetype: string
  width: number
  height: number
}
export type renditions = Record<string, rendition>

export const findRenditionByUsageAndVariant = (renditions: renditions, usage = 'Thumbnail', variant = 'Normal'): rendition => {
  const matchingRenditions = Object.values(renditions).filter((rendition) => {
    return rendition?.usage === usage && rendition?.variant === variant
  })

  if (matchingRenditions.length > 0) {
    return matchingRenditions[0]
  } else {
    return {
      usage,
      variant,
      href: 'not found',
      mimetype: 'image/jpeg',
      width: 0,
      height: 0
    }
  }
}
