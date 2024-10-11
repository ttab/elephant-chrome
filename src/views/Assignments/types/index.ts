

interface Assignee {
  name: string
  rel: string
  role: string
  type: string
  uuid: string
}

interface Status {
  rel: string
  type: string
  uuid: string
}

interface EventData {
  end_date: string
  public: boolean
  start_date: string
  tentative: boolean
}

interface EventDetails {
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

export interface MetaOne {
  data: EventData
  type: string
}

export type MetaValueType = MetaOne | MetaTwo | TypeValue

export interface MetaTwo {
  data: EventDetails
  id: string
  links: Array<Assignee | Status>
  meta: TypeValue[]
  title: string
  type: string | undefined
}

interface Document {
  language: string
  links: Array<Assignee | Status>
  meta?: MetaValueType[]
  title: string
  type: string
  uri: string
  uuid: string
}


export interface Item {
  document: Document
  id: string
  score: number
  sort?: string[]
}

export interface Response<T> {
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

export type AssignmentItemResponse<T> = Response<T>
