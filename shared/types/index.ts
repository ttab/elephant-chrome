import { type Block } from '../protos/service.js'

export interface YBlock extends Block {
  __inProgress?: boolean
  meta: YBlock[]
  links: YBlock[]
  content: YBlock[]
}

