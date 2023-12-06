'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { actions } from './Actions'
import { priority } from './Priority'
import { title } from './Title'
import { section } from './Section'
import { assignees } from './Assignees'
import { type } from './Type'

export const columns: Array<ColumnDef<Planning>> = [
  priority,
  title,
  section,
  assignees,
  type,
  actions
]
