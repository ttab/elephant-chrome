import { type Block } from '@ttab/elephant-api/newsdoc'

export interface YBlock extends Block {
  __inProgress?: boolean
  meta: YBlock[]
  links: YBlock[]
  content: YBlock[]
}

