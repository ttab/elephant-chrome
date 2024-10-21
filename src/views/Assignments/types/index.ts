export type AssignmentMetaExtended = AssignmentMeta & { planningTitle: string, newsvalue: string, _id: string }

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

interface AssignmentEventData {
  end_date: string
  public: boolean
  start_date: string
  tentative: boolean
}

export interface AssignmentDateDetails {
  end: string
  end_date: string
  full_day: 'true' | 'false'
  public: 'true' | 'false'
  publish: string
  start: string
  start_date: string
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
  data: AssignmentDateDetails
  id: string
  links: Array<AssigneeMeta | Status>
  meta: TypeValue[]
  title: string
  type: string | undefined
}

export type MetaValueType = TypeData | AssignmentMeta | TypeValue

interface Document {
  language: string
  links: Array<AssigneeMeta | Status>
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

export interface AssignmentResponse<T> {
  took: string
  shards: {
    total: number
    successful: number
  }
  hits: {
    total: {
      value: string
      relation: string
    }
    hits: T[]
  }
}

export type AssignmentItemResponse<T> = AssignmentResponse<T>
