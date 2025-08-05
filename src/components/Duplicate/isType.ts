import type { EventData } from '@/views/Event/components/EventTime'
import type { PlanningData } from '@/types/index'

export const isEvent = (data: unknown): data is EventData => {
  return data !== null && typeof data === 'object' && Object.keys(data).includes('dateGranularity')
}

export const isPlanning = (data: unknown): data is PlanningData => {
  return data !== null && typeof data === 'object' && Object.keys(data).includes('start_date')
}
