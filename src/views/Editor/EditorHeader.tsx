import { useDocumentStatus, useView, useYValue } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { getValueByYPath } from '@/lib/yUtils'
import type { EleBlock } from '@/shared/types'
import { usePlanningIdFromAssignmentId } from '@/hooks/index/usePlanningIdFromAssignmentId'
import type * as Y from 'yjs'

export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const [assignmentId, setAssignmentId] = useState('')
  const planningId = usePlanningIdFromAssignmentId(assignmentId)
  const planningDoc = useCollaborationDocument({ documentId: planningId })

  // FIXME: Empty for (some?) elephant created articles, always works for dawroc created articles!
  const [articleAssignmentLinks] = useYValue<EleBlock[]>('links.core/assignment')
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])


  // Find the linked assignment id for this article
  // FIXME: It seems articleAssignmentLinks are sometimes/always empty on articles created in Elephant
  useEffect(() => {
    if (!articleAssignmentLinks?.length) {
      return
    }

    for (const assignment of articleAssignmentLinks) {
      if (assignment.type === 'core/assignment') {
        setAssignmentId(assignment.uuid)
        break
      }
    }
  }, [articleAssignmentLinks])


  // Get the planning yjs document root ele map
  const planning = useMemo(() => {
    return (planningDoc.document && planningDoc.synced)
      ? planningDoc.document.getMap('ele')
      : null
  }, [planningDoc])


  // Create callback to handle setStatus (withheld etc)
  const setArticleStatus = useCallback((newStatus: string, data?: Record<string, unknown>) => {
    if (!planning || !articleAssignmentLinks?.length) {
      // FIXME: Notify user that something is wrong
      alert('No planning or no article assignment links. Failed setting status!')
      return
    }


    const [assignments] = getValueByYPath<Y.Array<Y.Map<unknown>>>(planning, 'meta.core/assignment', true)
    if (!assignments) {
      // FIXME: Notify user that something is wrong
      alert('No assignment in related planning. Failed setting status!')
      return
    }

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments.get(i)
      if (assignment.get('id') === documentId) {
        debugger
      }
    }

    if (typeof data?.foo === 'string') {
      void setDocumentStatus(newStatus)
    }
  }, [planning, articleAssignmentLinks, setDocumentStatus, documentId])

  return (
    <ViewHeader.Root>
      <ViewHeader.Title name='Editor' title='Editor' icon={PenBoxIcon} />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @lg/view:flex'>
              <Newsvalue />
              <AddNote />
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && (
              <>
                <StatusMenu type='core/article' status={documentStatus} setStatus={setArticleStatus} />
                <ViewHeader.RemoteUsers documentId={documentId} />
              </>
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action>
        <MetaSheet container={containerRef.current} />
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
