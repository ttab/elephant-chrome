import type {
  GetDocumentResponse,
  Document,
  Block
} from '../protos/service.js'

import type {
  TBElement
} from '@ttab/textbit'

/**
 * Defines the raw NewsDoc object model used in Elepahant chrome which is
 * most often converted into a yjs structure.
 *
 * The format is closely based on and inherits most properties from the
 * protobuf generated format.
 *
 * The key differenceis is this format groups meta and links for a more
 * convenient access and also converts content to TBElement for Textbit.
 */
export interface YDocumentResponse extends Omit<GetDocumentResponse, 'document' | 'version'> {
  version: string
  document?: YDocument
}

export interface YDocument extends Omit<Document, 'meta' | 'links' | 'content'> {
  meta: YBlockGroup
  links: YBlockGroup
  language: string
  content: TBElement[]
}

export type YBlockGroup = Record<string, YBlock[]>
// export interface YBlockGroup { [key: string]: YBlock[] }

export interface YBlock extends Omit<Block, 'meta' | 'links' | 'content'> {
  __inProgress?: boolean
  meta: YBlockGroup
  links: YBlockGroup
  content: YBlockGroup
}
