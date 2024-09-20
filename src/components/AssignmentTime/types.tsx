import { type Block } from '@/protos/service'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { type Calendar } from '@ttab/elephant-ui'

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

declare module 'Calendar' {
type Modifier = string;
enum InternalModifier {
  Outside = "outside",
  /** Name of the modifier applied to the disabled days, using the `disabled` prop. */
  Disabled = "disabled",
  /** Name of the modifier applied to the selected days using the `selected` prop). */
  Selected = "selected",
  /** Name of the modifier applied to the hidden days using the `hidden` prop). */
  Hidden = "hidden",
  /** Name of the modifier applied to the day specified using the `today` prop). */
  Today = "today",
  /** The modifier applied to the day starting a selected range, when in range selection mode.  */
  RangeStart = "range_start",
  /** The modifier applied to the day ending a selected range, when in range selection mode.  */
  RangeEnd = "range_end",
  /** The modifier applied to the days between the start and the end of a selected range, when in range selection mode.  */
  RangeMiddle = "range_middle"
}
type ActiveModifiers = Record<Modifier, true> & Partial<Record<InternalModifier, true>>
export type DayClickEventHandler = (day: Date, activeModifiers: ActiveModifiers, e: MouseEvent) => void
export type DayMouseEventHandler = (day: Date, activeModifiers: ActiveModifiers, e: MouseEvent) => void
}
