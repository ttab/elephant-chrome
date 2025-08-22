import type { LocaleData, View } from '@/types/index'
import { type ViewMetadata } from '@/types/index'
import { Badge } from '@ttab/elephant-ui'
import { useRef } from 'react'
import { format } from 'date-fns'
import { useRegistry } from '@/hooks/useRegistry'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useHistory, useNavigation, useView } from '@/hooks/index'
import { cn } from '@ttab/elephant-ui/utils'
import type { HitV1 } from '@ttab/elephant-api/index'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { useLatest } from './hooks/useLatest'
import { CalendarDays, Library, Pen } from '@ttab/elephant-ui/icons'
import { CreatePrintArticle } from '@/components/CreatePrintArticle'
import { useModal } from '@/components/Modal/useModal'
import { ActionMenu } from '@/components/ActionMenu'
import { documentTypeLinkTarget } from '@/lib/documentTypeLinkTarget'

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
  const { locale } = useRegistry()
  const data = useLatest()

  if (!data?.length) {
    return <div className='min-h-screen text-center py-2'>Laddar...</div>
  }

  return (
    <Content documents={data} locale={locale} setOpen={setOpen} />
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
        // Workaround, document.type is not indexed for core/flash
        const type = item.fields['document.type']?.values[0]
          ? item.fields['document.type'].values[0]
          : uri.startsWith('core://flash')
            ? 'core/flash'
            : undefined

        const linkTarget = documentTypeLinkTarget(type)

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
                viewItem: state.viewRegistry.get(linkTarget.to),
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
                    {type === 'core/flash' ? 'TT-FLASH' : slugline}
                  </Badge>

                  <div>
                    {section}
                  </div>
                </div>
              </div>
            </div>
            <Menu documentId={id} documentType={type} linkTarget={linkTarget} />
          </div>
        )
      }
      )}
    </div>
  )
}

const Menu = ({ documentId, documentType }: {
  documentId: string
  documentType?: string
  linkTarget: {
    to: View
    label: string
  }
}): JSX.Element => {
  const planningId = useDeliverablePlanningId(documentId)
  const { showModal, hideModal } = useModal()

  const linkTarget = documentTypeLinkTarget(documentType)

  return (
    <ActionMenu actions={[
      {
        title: `Öppna ${linkTarget.label}`,
        icon: Pen,
        to: linkTarget.to,
        id: documentId
      },
      {
        title: 'Öppna planering',
        icon: CalendarDays,
        to: 'Planning',
        id: planningId
      },
      {
        title: 'Skapa printartikel',
        icon: Library,
        disabled: documentType !== 'core/article',
        onClick: () => {
          showModal(
            <CreatePrintArticle
              asDialog
              onDialogClose={hideModal}
              id={documentId}
            />
          )
        }

      }
    ]}
    />
  )
}

Latest.meta = meta
