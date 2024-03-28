import { type Block } from '../../../protos/service.js'

export function textToNewsDoc(text: string): Block[] {
  return (text || '').split('\n').map((line) => {
    return {
      id: crypto.randomUUID(),
      uuid: '',
      uri: '',
      url: '',
      type: 'core/paragraph',
      title: '',
      data: {
        text: line
      },
      rel: '',
      role: '',
      name: '',
      value: '',
      contentType: '',
      links: [],
      content: [],
      meta: []
    }
  })
}
