
const conceptDocumentTypes: string[] = [
  'core/section',
  'core/story'
]

const conceptViewTypes: string[] = [
  'Section',
  'Story'
]

export const isConceptType = (type: string | undefined): boolean => {
  if (type === undefined) {
    return false
  } else {
    return conceptDocumentTypes.includes(type) || conceptViewTypes.includes(type)
  }
}
