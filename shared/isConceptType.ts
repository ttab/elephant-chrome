

const conceptDocumentTypes = [
  'core/section',
  'core/story',
  'core/organiser'
]
export const isConceptType = (type: string | undefined): boolean => {
  if (type === undefined) {
    return false
  } else {
    return conceptDocumentTypes.includes(type)
  }
}
