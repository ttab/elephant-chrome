import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { actions } from './Actions'
import { priority } from './Priority'
import { title } from './Title'
import { section } from './Section'
import { assignees } from './Assignees'
import { type } from './Type'
import { time } from './Time'

export const columns: Array<ColumnDef<Planning>> = [
  priority,
  title,
  section,
  assignees,
  type,
  time,
  actions
]
