import { type JSX } from 'react'
import { fields, type Wire, type WireFields } from '@/shared/schemas/wire'
import { useQuery } from '@/hooks'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/wires'
import { SortingV1 } from '@ttab/elephant-api/index'
import { StreamEntry } from './StreamEntry'
import { Filter } from '@/components/Filter'
import { StreamTools } from './StreamTools'
import { MinusIcon, SaveIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'

export const Stream = ({ streamId, wireStream }: {
  streamId: string
  wireStream: string // TODO: Needs to be filter specification with unique stable id, not just a number
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['section', 'source', 'query', 'newsvalue'])

  const { data } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: 40,
    query: constructQuery(filter),
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined,
    fields,
    sort: [
      SortingV1.create({ field: 'modified', desc: true })
    ],
    options: {
      setTableData: true,
      subscribe: true
    }
  })

  return (
    <>
      {/* Column Wrapper */}
      <div data-stream-id={streamId} className='flex flex-col h-full overflow-x-visible snap-start snap-always min-w-80 max-w-120 overflow-y-hidden border-e'>
        {/* Column */}
        <div className='col-span-1 grow flex flex-col min-w-0 overflow-y-auto flex-1'>

          {/* Column header */}
          <div className='bg-background flex items-center justify-between py-1 px-4 border-b sticky top-0 z-10'>
            <Filter page={String(1)} pages={[String(1)]} setPages={() => { }} search={undefined} setSearch={() => {}}>
              <StreamTools page={String(1)} pages={[String(1)]} setPages={() => { }} search={undefined} setSearch={() => { }} />
            </Filter>
            <div>
              <Button variant='ghost' disabled={true} className='w-9 h-9 px-0' onClick={() => {}}>
                <SaveIcon strokeWidth={1.75} size={18} />
              </Button>
              <Button variant='ghost' className='w-9 h-9 px-0' onClick={() => {}}>
                <MinusIcon strokeWidth={1.75} size={18} />
              </Button>
            </div>
          </div>

          {/* Column content */}
          <div className='flex flex-col divide-y'>
            {data?.map((entry) => {
              return (
                <StreamEntry key={entry.id} entry={entry} />
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
