import type { AssignmentData } from '@/components/AssignmentTime/types'

export type AssignmentMetaExtended = AssignmentMeta & {
  planningTitle: string
  newsvalue: string
  _id: string
  section: string
}

export interface AssigneeMeta {
  name: string
  rel: string
  role: string
  title: string
  type: string
  uuid: string
}

export interface Status {
  rel: string
  type: string
  uuid: string
}

export interface LinkMeta extends Status {
  title: string
}

interface AssignmentEventData {
  end_date: string
  public: boolean
  start_date: string
  tentative: boolean
}

export interface TypeValue {
  type: string
  value: string
}

export interface TypeData {
  type: string
  data: AssignmentEventData
}

export interface AssignmentMeta {
  data: AssignmentData
  id: string
  links: Array<AssigneeMeta | Status | LinkMeta>
  meta: TypeValue[]
  title: string
  type: string | undefined
}

export type MetaValueType = TypeData | AssignmentMeta | TypeValue

interface Document {
  language: string
  links: Array<AssigneeMeta | Status | LinkMeta>
  meta?: MetaValueType[]
  title: string
  type: string
  uri: string
  uuid: string
}

export interface LoadedDocumentItem {
  document: Document
  id: string
  score: number
  sort?: string[]
}
