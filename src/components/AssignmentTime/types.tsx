import { type Block } from '@ttab/elephant-api/newsdoc'
import { type LucideIcon } from '@ttab/elephant-ui/icons'

export interface AssignmentValueOption {
  payload?: Block
  label: string
  value: string
  icon?: LucideIcon
  iconProps?: {
    size?: number
    fill?: string
    color?: string
    strokeWidth?: number
    className?: string
  }
  color?: string
  info?: string
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

