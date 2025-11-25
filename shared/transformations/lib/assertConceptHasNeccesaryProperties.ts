import type { Document } from '@ttab/elephant-api/newsdoc'
import { Block } from '@ttab/elephant-api/newsdoc'

export const assertConceptHasNecessaryProperties = (document: Document | Block) => {
  if (!document) {
    return
  }
  if (document.type === 'core/organiser') {
    document.meta = document.meta.map((block) => {
      switch (block.type) {
        case 'core/contact-info':
          return Block.create({
            id: '',
            type: 'core/contact-info',
            data: {
              city: '',
              country: '',
              email: '',
              phone: '',
              streetAddress: '',
              ...(block?.data || {})
            }
          })
        default:
          return block
      }
    })

    document.links = document.links.map((block) => {
      switch (block.type) {
        case 'text/html':
          return Block.create({
            url: '',
            type: 'text/html',
            rel: 'see-also'
          })
        default:
          return block
      }
    })
  }

  if (document.type === 'core/story') {
    const short = document.meta.find((d) => d.role === 'short')
    const long = document.meta.find((d) => d.role === 'long')

    if (!short) {
      document.meta.push(Block.create({
        type: 'core/definition',
        role: 'short',
        data: {
          text: ''
        }
      }))
    }

    if (!long) {
      Block.create({
        type: 'core/definition',
        role: 'long',
        data: {
          text: ''
        }
      })
    }
  }
}

