import { createDatastoreProvider } from '../lib/createDatastoreProvider'
import { type IDBStory } from '../types'

export const { Context: CoreStoryContext, Provider: CoreStoryProvider }
  = createDatastoreProvider<IDBStory>({
    documentType: 'core/story',
    fields: [
      'document.title',
      'document.meta.core_definition.role',
      'document.meta.core_definition.data.text'
    ],
    transformer: (hit) => {
      const { id, fields: f } = hit
      const roles = f['document.meta.core_definition.role']?.values ?? []
      const texts = f['document.meta.core_definition.data.text']?.values ?? []

      const story = {
        id,
        title: f['document.title']?.values?.[0]?.trim() ?? '',
        shortText: '',
        longText: ''
      }

      for (let i = 0; i < roles.length; i++) {
        const role = roles[i]?.trim()
        const text = texts[i]?.trim() ?? ''
        if (role === 'short') {
          story.shortText = text
        } else if (role === 'long') {
          story.longText = text
        }
      }

      return story
    }
  })
