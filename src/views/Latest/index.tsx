import { useDocuments } from '@/hooks/index/useDocuments'
import type { LocaleData } from '@/types/index'
import { type ViewMetadata } from '@/types/index'
import { Badge } from '@ttab/elephant-ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { useRegistry } from '@/hooks/useRegistry'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useHistory, useNavigation, useView } from '@/hooks/index'
import { cn } from '@ttab/elephant-ui/utils'
import { ActionMenu } from '@/components/ActionMenu'
import type { HitV1 } from '@ttab/elephant-api/index'
import { QueryV1, RangeQueryV1, SortingV1 } from '@ttab/elephant-api/index'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'

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

export const Latest = ({ setOpen }: { setOpen?: (open: boolean) => void }) => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [versionedData, setVersionedData] = useState<HitV1[]>([])

  const { data: dataArticles } = useDocuments({
    documentType: 'core/article',
    fields: [
      'document.title',
      'document.uri',
      'heads.usable.created',
      'heads.usable.version',
      'document.meta.tt_slugline.value',
      'document.rel.section.title'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'heads.usable.created',
          gte: 'now-24h'
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'heads.usable.created', desc: true })
    ]
  })

  const { data: dataFlashes } = useDocuments({
    documentType: 'core/flash',
    fields: [
      'document.title',
      'document.uri',
      'heads.usable.created',
      'heads.usable.version',
      'document.rel.section.title'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'heads.usable.created',
          gte: 'now-24h'
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'heads.usable.created', desc: true })
    ]
  })

  const { data: dataEditorialInfo } = useDocuments({
    documentType: 'core/editorial-info',
    fields: [
      'document.title',
      'document.uri',
      'heads.usable.created',
      'heads.usable.version',
      'document.meta.tt_slugline.value',
      'document.rel.section.title'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'heads.usable.created',
          gte: 'now-24h'
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'heads.usable.created', desc: true })
    ]
  })

  const data = useMemo(
    () =>
      [
        ...(dataArticles ?? []),
        ...(dataFlashes ?? []),
        ...(dataEditorialInfo ?? [])
      ].sort((a, b) => {
        const aCreated = a.fields['heads.usable.created']?.values?.[0]
        const bCreated = b.fields['heads.usable.created']?.values?.[0]
        return (bCreated ?? '').localeCompare(aCreated ?? '')
      }),
    [dataArticles, dataFlashes, dataEditorialInfo]
  )

  // Append search result with the title of the usable version
  useEffect(() => {
    if (!data || !session?.accessToken) return

    const fetchDocuments = async () => {
      try {
        const repositoryDocuments = await repository?.getDocuments({
          documents: data.map(({ id, fields }: HitV1) => ({
            uuid: id,
            version: fields['heads.usable.version']?.values[0]
              ? BigInt(fields['heads.usable.version'].values[0])
              : undefined
          })),
          accessToken: session.accessToken
        })

        setVersionedData(
          data.map((item) => {
            const repoDoc = repositoryDocuments?.items.find(
              (doc) => doc.document?.uuid === item.id
            )

            return {
              ...item,
              fields: {
                ...item.fields,
                'document.title': {
                  values: [repoDoc?.document?.title || item.fields['document.title']?.values[0]]
                }
              }
            }
          })
        )
      } catch (error) {
        console.error(error)
        toast.error('Kunde inte hämta dokument')
      }
    }

    void fetchDocuments()
  }, [data, repository, session?.accessToken])

  const { locale } = useRegistry()

  if (!versionedData?.length) {
    return <div className='min-h-screen text-center py-2'>Laddar...</div>
  }

  return (
    <Content documents={versionedData} locale={locale} setOpen={setOpen} />
  )
}

const Content = ({ documents, locale }: {
  documents: HitV1[]
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
      {documents.map((item: HitV1) => {
        if (!item) {
          return <></>
        }

        const id = item.id
        const title = item.fields['document.title']?.values[0]
        const lastUsableVersion = item.fields['heads.usable.version']?.values[0]
        const publish = item.fields['heads.usable.created']?.values[0]
        const slugline = item.fields['document.meta.tt_slugline.value']?.values[0]
        const section = item.fields['document.rel.section.title']?.values[0]
        const uri = item.fields['document.uri']?.values[0]

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
                  {publish && <div>{`${getLocalizedDate(new Date(publish), locale)}`}</div>}
                </div>

                <div className='flex gap-2 items-center w-full text-muted-foreground  -ml-1'>
                  <Badge
                    size='xs'
                    variant='ghost'
                    className='bg-background rounded-md text-muted-foreground font-normal text-sm whitespace-nowrap'
                    data-row-action
                  >
                    {uri.startsWith('core://flash') ? 'TT-FLASH' : slugline}
                  </Badge>

                  <div>
                    {section}
                  </div>
                </div>
              </div>
            </div>
            <Menu articleId={id} />
          </div>
        )
      }
      )}
    </div>
  )
}


const Menu = ({ articleId }: { articleId: string }): JSX.Element => {
  const planningId = useDeliverablePlanningId(articleId)
  return (
    <div className='shrink p-'>
      <ActionMenu
        actions={[
          {
            to: 'Editor',
            id: articleId,
            title: 'Öppna artikel'
          },

          {
            to: 'Planning',
            id: planningId,
            title: 'Öppna planering'
          }
        ]}
      />
    </div>
  )
}

Latest.meta = meta
