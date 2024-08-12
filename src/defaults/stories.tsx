import { Block } from '@/protos/service'
import { type DefaultValueOption } from '@/types'

export const Stories: DefaultValueOption[] = [
  {
    value: '989a5d7d-714c-4882-b64d-281b31000caa',
    label: 'Gängkriminaliteten',
    payload: Block.create({
      uuid: '989a5d7d-714c-4882-b64d-281b31000caa',
      title: 'Gängkriminaliteten',
      rel: 'story'
    })
  },
  {
    value: 'f5c2ac15-ce79-4ad9-b663-2ca314af3b4b',
    label: 'Israel-Hamas',
    payload: Block.create({
      uuid: 'f5c2ac15-ce79-4ad9-b663-2ca314af3b4b',
      type: 'core/story',
      title: 'Israel-Hamas',
      rel: 'story'
    })
  }
]
