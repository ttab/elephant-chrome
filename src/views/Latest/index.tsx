import { useAssignments } from '@/hooks/index/useAssignments'
import { useSections } from '@/hooks/useSections'
import type { LocaleData } from '@/types/index'
import { type ViewMetadata } from '@/types/index'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { Badge } from '@ttab/elephant-ui'
import { useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { useRegistry } from '@/hooks/useRegistry'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useHistory, useNavigation, useView } from '@/hooks/index'
import type { StatusData } from 'src/datastore/types'
import { cn } from '@ttab/elephant-ui/utils'
import { ActionMenu } from './components/ActionMenu'

const meta: ViewMetadata = {
  name: 'Latest',
  path: `${import.meta.env.BASE_URL || ''}/latest`,
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

type DocumentExtended = Document & {
  planningId: string
  planningTitle: string
  publish?: string
  slugline?: string
  section?: string
  lastUsableVersion?: bigint
}

export const Latest = ({ setOpen }: { setOpen?: (open: boolean) => void }) => {
  const date = useMemo(() => new Date(), [])
  const [data] = useAssignments({
    type: 'text',
    date,
    dateType: 'publish',
    status: ['usable']
  })

  const { locale } = useRegistry()

  const sections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const documents: DocumentExtended[] = useMemo(() => {
    if (!data[0]?.items?.length) {
      return []
    }

    return data[0].items.reduce((docs: DocumentExtended[], curr) => {
      if (!curr._deliverableDocument) {
        return docs
      }

      const doc: DocumentExtended = {
        planningId: curr._planningId,
        planningTitle: curr._planningTitle,
        ...curr._deliverableDocument
      }

      if (curr?.data?.publish) {
        doc.publish = curr.data.publish
      }

      if (curr?._section) {
        doc.section = sections.find((s) => s.value === curr._section)?.label
      }

      const lastUsableVersion = () => {
        if (!curr._statusData) {
          return
        }

        const parsedData = JSON.parse(curr._statusData) as StatusData
        const lastUsableVersion = parsedData?.heads.usable?.version
        return lastUsableVersion
      }

      if (lastUsableVersion()) {
        doc.lastUsableVersion = lastUsableVersion()
      }

      doc.slugline = curr._deliverableDocument.meta.find((m) => m.type === 'tt/slugline')?.value

      docs.push(doc)
      return docs
    }, [])
  }, [data, sections])


  if (!documents.length) {
    return <div className='min-h-screen text-center py-2'>Laddar...</div>
  }

  return (
    <Content documents={documents} locale={locale} setOpen={setOpen} />
  )
}

const Content = ({ documents, locale }: {
  documents: DocumentExtended[]
  locale: LocaleData
  setOpen?: (open: boolean) => void
}): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId } = useView()

  const origin = useRef(history.state?.viewId)

  function getLocalizedDate(date: Date, locale: LocaleData): string | undefined {
    if (!locale.module) {
      console.warn(`Locale ${locale.code.full} not supported.`)
      return format(date, 'dd MMM yyyy – HH.mm')
    }

    return format(date, 'dd MMM yyyy – HH.mm', { locale: locale.module })
  }

  return (
    <div className='min-h-screen max-h-screen overflow-y-auto divide-y'>
      {documents.map((itm: DocumentExtended) => {
        if (!itm) {
          return <></>
        }

        const { title, uuid: id, lastUsableVersion } = itm

        return (
          <div
            key={id}
            className={cn('hover:bg-gray-100 flex flex-row py-3 pl-5 pr-3',
              id ? 'cursor-pointer' : 'cursor-not-allowed'
            )}
            onClick={() => {
              if (!id) {
                return
              }

              handleLink({
                dispatch,
                viewItem: state.viewRegistry.get('Editor'),
                props: { id, version: lastUsableVersion?.toString() },
                viewId: crypto.randomUUID(),
                history,
                origin: origin.current || viewId
              })
            }}
          >
            <div className='grow'>
              <div className='text-sm flex flex-col gap-2'>
                <div className='font-medium'>{title}</div>

                <div className='text-xs text-muted-foreground'>
                  {itm?.publish && <div>{`${getLocalizedDate(new Date(itm.publish), locale)}`}</div>}
                </div>

                <div className='flex gap-2 items-center w-full text-muted-foreground  -ml-1'>
                  <Badge
                    size='xs'
                    variant='ghost'
                    className='bg-background rounded-md text-muted-foreground font-normal text-sm whitespace-nowrap'
                    data-row-action
                  >
                    {itm.slugline}
                  </Badge>

                  <div>
                    {itm.section}
                  </div>
                </div>
              </div>
            </div>

            <div className='shrink p-'>
              <ActionMenu
                actions={[
                  {
                    to: 'Editor',
                    id,
                    title
                  },
                  {
                    to: 'Planning',
                    id: itm.planningId,
                    title: itm.planningTitle
                  }
                ]}
              />
            </div>
          </div>
        )
      }
      )}
    </div>
  )
}


Latest.meta = meta
