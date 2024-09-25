import { type Block } from '@/protos/service'
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

