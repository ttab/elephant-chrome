type CopyGroupBase = ['document.id', 'document.title']
type DuplicateBase = ['document.title']
type WithEventDate = ['document.meta.core_event.data.start', 'document.meta.core_event.data.end']
type WithPlanningDate = ['document.meta.core_planning_item.data.start_date']

export type CopyGroupFields = ['document.id', 'document.title', 'document.meta.core_event.data.start' | 'document.meta.core_planning_item.data.start_date']
export type DuplicateFields
  = | [...DuplicateBase, ...WithEventDate]
    | [...DuplicateBase, ...WithPlanningDate]

export const copyGroupFields = (t: 'core/event' | 'core/planning-item'): CopyGroupFields => {
  const base: CopyGroupBase = ['document.id', 'document.title']

  if (t === 'core/event') {
    return [...base, 'document.meta.core_event.data.start']
  } else {
    return [...base, 'document.meta.core_planning_item.data.start_date']
  }
}

export const duplicateFields = (t: 'core/event' | 'core/planning-item'): DuplicateFields => {
  const base: DuplicateBase = ['document.title']
  if (t === 'core/event') {
    return [...base, 'document.meta.core_event.data.start', 'document.meta.core_event.data.end']
  } else {
    return [...base, 'document.meta.core_planning_item.data.start_date']
  }
}
