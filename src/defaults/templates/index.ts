import type { Block } from '@ttab/elephant-api/newsdoc'

export { articleDocumentTemplate as article } from './articleDocumentTemplate'
export { flashDocumentTemplate as flash } from './flashDocumentTemplate'
export { factboxDocumentTemplate as factbox } from './factboxDocumentTemplate'
export { assignmentPlanningTemplate as assignment } from './assignmentPlanningTemplate'
export { planningDocumentTemplate as planning } from './planningDocumentTemplate'
export { eventDocumentTemplate as event } from './eventDocumentTemplate'

export interface TemplatePayload {
  title?: string
  meta?: {
    'tt/slugline'?: Block[]
    'core/newsvalue'?: Block[]
    'core/planning-item'?: Block[]
  }
  links?: {
    'core/section'?: Block[]
    'core/story'?: Block[]
    'tt/wire'?: Block[]
    'core/event'?: Block[] // FIXME: Is this correct?
  }
}
