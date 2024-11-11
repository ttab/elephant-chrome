import { type DefaultValueOption } from '@ttab/elephant-ui'
export interface AssignmentValueOption extends DefaultValueOption {
  slots?: string[]
  median?: string
}

export interface AssignmentData {
  end_date?: string
  full_day?: string
  start_date?: string
  end?: string
  start?: string
  public?: string
  publish?: string
  publish_slot?: string
}

