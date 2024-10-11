import * as Y from 'yjs'
import { getValueByYPath } from '@/lib/yUtils'
import { toYMap } from '../../../src-srv/utils/transformations/lib/toYMap'
import { YBlock } from '@/shared/YBlock'

export function addAssignmentLinkToFlash(flashDoc: Y.Doc, assignmentId: string): void {
  const flash = flashDoc.getMap('ele')
  const [flashLinks] = getValueByYPath<Y.Map<Y.Array<unknown>>>(flash, 'links', true)

  if (!flashLinks) {
    throw new Error('Flash document is missing links array, could not create flash')
  }

  const assignmentLink = toYMap(
    YBlock.create({
      type: 'core/assignment',
      rel: 'assignment',
      uuid: assignmentId
    })[0] as unknown as Record<string, unknown>
  )

  const assignmentLinks = new Y.Array()
  assignmentLinks.push([assignmentLink])
  flashLinks.set('core/assignment', assignmentLinks)
}
