import { AwarenessDocument, ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useQuery } from '@/hooks'
import { SluglineEditable } from '@/components/DataItem/Slugline'
import {
  PlanAssignments,
  PlanDate,
  PlanSector,
  PlanStatus,
  PlanTitle,
  PlanPriority,
  PlanCategory,
  PlanStory,
  PlanDocumentStatus,
  PlanDescription
} from './components'
import * as Y from 'yjs'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import { useEffect, useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { type Element } from 'slate'

const meta: ViewMetadata = {
  name: 'Planning',
  path: `${import.meta.env.BASE_URL || ''}/planning`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}


export const Planning = (props: ViewProps): JSX.Element => {
  const query = useQuery()
  const [planningId, setPlanningId] = useState(props.id || query.id)
  const documentId = planningId || crypto.randomUUID()

  useEffect(() => {
    // When we had no planningId and created a new documentId, sync them
    if (planningId !== documentId) {
      setPlanningId(documentId)
    }
  }, [planningId, documentId])

  // TODO: Extract this to shared function where most will be used by both client and server
  const createPlanningDocument = (): Y.Doc => {
    // {
    //   uuid: crypto.randomUUID(),
    //   type: 'core/planning-item',
    //   uri: `core://newscoverage/${documentId}`,
    //   url: '',
    //   title: '',
    //   content: [],
    //   meta: [],
    //   links: [],
    //   language: 'sv-se'
    // }
    const document = new Y.Doc()

    // Create internal structure so that we know this is a draft
    // and should not be serialized to the repository.
    const _internal = document.getMap('_internal')
    _internal.set('draft', true)

    const planningYMap = document.getMap('planning')
    planningYMap.set('meta', new Y.Map())
    planningYMap.set('links', new Y.Map())

    const root = new Y.Map()
    root.set('title', 'Ny planering')
    root.set('uuid', documentId)
    root.set('type', 'core/planning-item')
    root.set('language', 'sv-se')

    const emptyText = (): Element[] => {
      return [{
        id: crypto.randomUUID(),
        class: 'text',
        type: 'core/text',
        children: [{ text: '' }]
      }]
    }

    const title = document.get('title', Y.XmlText)
    const publicDescription = document.get('publicDescription', Y.XmlText)
    const internalDescription = document.get('internalDescription', Y.XmlText)

    title.applyDelta(slateNodesToInsertDelta(emptyText()))
    publicDescription.applyDelta(slateNodesToInsertDelta(emptyText()))
    internalDescription.applyDelta(slateNodesToInsertDelta(emptyText()))

    planningYMap.set('planning', root)

    return document
  }

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={!planningId ? createPlanningDocument() : undefined}>
          <PlanningViewContent {...props} documentId={documentId} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

const PlanningViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const viewVariants = cva('flex flex-col', {
    variants: {
      asDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
      }
    }
  })

  const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-4', {
    variants: {
      asDialog: {
        false: 'p-8',
        true: 'p-6'
      }
    }
  })

  return (
    <div className={cn(viewVariants({ asDialog: !!props.asDialog, className: props?.className }))}>
      <div className="grow-0">
        <ViewHeader.Root>
          {!props.asDialog &&
            <ViewHeader.Title title='Planering' icon={GanttChartSquare} />
          }

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2'>
              <PlanDocumentStatus />
              <PlanStatus />
              <PlanPriority />
            </div>
          </ViewHeader.Content>

          <ViewHeader.Action onDialogClose={props.onDialogClose}>
            {!props.asDialog && !!props.documentId &&
              <ViewHeader.RemoteUsers documentId={props.documentId} />
            }
          </ViewHeader.Action>
        </ViewHeader.Root>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <section className={cn(sectionVariants({ asDialog: !!props?.asDialog }))}>
          <div className='flex space-x-2 items-center'>
            <PlanTitle />
            <SluglineEditable />
          </div>

          <div className='flex flex-col gap-4'>
            <PlanDescription role="public" name="publicDescription" />
            <PlanDescription role="internal" name="internalDescription" />
          </div>

          <PlanDate />

          <div className='flex space-x-2'>
            <PlanSector />
            <PlanCategory />
            <PlanStory />
          </div>

          <PlanAssignments />
        </section>
      </ScrollArea>
    </div>
  )
}

Planning.meta = meta
