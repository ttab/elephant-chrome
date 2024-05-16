import { type Block } from '../protos/service.js'
import { type JWTPayload } from 'jose'

export interface JWT extends JWTPayload {
  sub: string
  sub_name: string
  scope: string
  units: string[]
  access_token: string
}

export interface YBlock extends Block {
  __inProgress?: boolean
  meta: YBlock[]
  links: YBlock[]
  content: YBlock[]
}

