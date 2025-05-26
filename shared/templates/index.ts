import type { Block } from '@ttab/elephant-api/newsdoc'

export { articleDocumentTemplate as article } from './articleDocumentTemplate.js'
export { flashDocumentTemplate as flash } from './flashDocumentTemplate.js'
export { factboxDocumentTemplate as factbox } from './factboxDocumentTemplate.js'
export { assignmentPlanningTemplate as assignment } from './assignmentPlanningTemplate.js'
export { planningDocumentTemplate as planning } from './planningDocumentTemplate.js'
export { eventDocumentTemplate as event } from './eventDocumentTemplate.js'
export { editorialInfoDocumentTemplate as editorialInfo } from './editorialInfoDocumentTemplate.js'

export interface TemplatePayload {
  title?: string
  meta?: {
    'tt/slugline'?: Block[]
    'core/newsvalue'?: Block[]
    'core/planning-item'?: Block[]
    'core/description'?: Block[]
    'core/event'?: Block[]
  }
  links?: {
    'core/section'?: Block[]
    'core/story'?: Block[]
    'tt/wire'?: Block[]
    'core/event'?: Block[]
  }
}
