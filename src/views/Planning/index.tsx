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
  const planningId = props.id || query.id
  const documentId = planningId || crypto.randomUUID()

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

    const _internal = document.getMap('_internal')
    _internal.set('draft', true)

    const planningYMap = document.getMap('planning')
    planningYMap.set('meta', new Y.Map())
    planningYMap.set('links', new Y.Map())

    const root = new Y.Map()
    root.set('title', 'Ny planering')
    root.set('uuid', crypto.randomUUID())
    root.set('type', 'core/planning-item')
    root.set('language', 'sv-se')

    const emptyText = {
      class: 'text',
      type: 'core/text',
      children: [{ text: '' }]
    }

    const publicDescription = document.get('publicDescription', Y.XmlText)
    const internalDescription = document.get('internalDescription', Y.XmlText)

    publicDescription.applyDelta(slateNodesToInsertDelta([{ id: crypto.randomUUID(), ...emptyText }]))
    internalDescription.applyDelta(slateNodesToInsertDelta([{ id: crypto.randomUUID(), ...emptyText }]))

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
  return (
    <div className={'flex flex-col h-screen'}>
      <div className="grow-0">
        <ViewHeader {...props} title="Planering" icon={GanttChartSquare}>
          <div className='flex w-full h-full items-center space-x-2'>
            <PlanDocumentStatus />
            <PlanStatus />
            <PlanPriority />
            <PlanTitle className='invisible @4xl:visible' />
          </div>
        </ViewHeader>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <section className='overscroll-auto @5xl:w-[1024px] space-y-4 p-8'>
          <div className='flex space-x-2 items-center'>
            <PlanTitle className='font-semibold text-xl leading-4 px-0' />
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
