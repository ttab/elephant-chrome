import type { Block, Document } from '@ttab/elephant-api/newsdoc'


export const assertConceptHasNoEmptyProperties = (document: Document | Block) => {
  document.meta = document.meta.filter((block) => Object.keys(block.data).length !== 0)
  document.links = document.links.filter((block) => block.url)

  document.meta.forEach((block) => {
    if (block.type === 'core/contact-info') {
      block.data = Object.fromEntries(Object.entries(block.data).filter(([__, value]) => value))
    }

    if (block.type === 'core/section') {
      block.data = Object.fromEntries(Object.entries(block.data).filter(([__, value]) => value))
    }
  })
  document.links = document.links.filter((block) => Object.keys(block.data))
  console.log(document)
}
