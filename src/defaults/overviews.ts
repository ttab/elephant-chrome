import { CalendarDaysIcon, CalendarPlus2, BriefcaseBusiness, type LucideIcon } from '@ttab/elephant-ui/icons'
import { type View } from '../types'

export const overviews: Array<{
  name: View
  label: string
  icon: LucideIcon
}> = [
  { name: 'Plannings', label: 'Planeringar', icon: CalendarDaysIcon },
  { name: 'Events', label: 'Händelser', icon: CalendarPlus2 },
  { name: 'Assignments', label: 'Uppdrag', icon: BriefcaseBusiness }
]
