import { useAssignments } from '@/hooks/index/useAssignments'
import { useSections } from '@/hooks/useSections'
import { type ViewMetadata } from '@/types/index'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { Separator } from '@ttab/elephant-ui'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { useRegistry } from '@/hooks/useRegistry'
import * as locales from 'date-fns/locale'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useHistory, useNavigation, useView } from '@/hooks/index'

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

type DocumentExtended = Document & { publish?: string, slugline?: string, section?: string }

export const Latest = () => {
  const [data] = useAssignments({
    type: 'text',
    date: new Date(),
    status: ['usable']
  })
  const { locale } = useRegistry()

  const sections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const documents: Document[] = useMemo(() => {
    if (!data[0]?.items?.length) {
      return []
    }
    return data[0].items.reduce((docs: DocumentExtended[], curr) => {
      if (!curr._deliverableDocument) {
        return docs
      }

      const doc: Document & { publish?: string, slugline?: string, section?: string } = curr._deliverableDocument
      if (curr?.data?.publish) {
        doc.publish = curr.data.publish
      }
      if (curr?._section) {
        doc.section = sections.find((s) => s.value === curr._section)?.label
      }
      doc.slugline = curr._deliverableDocument.meta.find((m) => m.type === 'tt/slugline')?.value

      docs.push(doc)
      return docs
    }, [])
  }, [data, sections])


  if (!documents.length) {
    return <div className='min-h-screen'>Laddar...</div>
  }

  return <Content documents={documents} locale={locale} />
}

const Content = ({ documents, locale }: { documents: Document[], locale: string }): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId } = useView()

  function getLocalizedDate(date: Date, localeCode: string): string | undefined {
    const [code] = localeCode.split('-')
    const _locale = locales[code.toLocaleLowerCase() as keyof typeof locales]

    if (!_locale) {
      console.warn(`Locale ${localeCode} not supported.`)
      return format(date, 'dd MMM yyyy – HH.mm')
    }

    return format(date, 'dd MMM yyyy – HH.mm', { locale: _locale })
  }

  return (
    <div className='min-h-screen max-h-screen overflow-y-auto'>
      {documents.map((itm: DocumentExtended, i: number) => {
        if (!itm) {
          return <></>
        }

        const { title, uuid } = itm
        return (
          <div
            key={uuid}
            className='hover:bg-gray-100'
            onClick={() => {
              handleLink({
                dispatch,
                viewItem: state.viewRegistry.get('Editor'),
                props: { id: itm.uuid },
                viewId: crypto.randomUUID(),
                history,
                origin: viewId,
                target: 'last'
              })
            }}
          >
            <div className='py-2 px-1 text-xs flex flex-col'>
              <div className='font-bold'>{title}</div>
              <div className='flex gap-2 items-center w-full text-muted-foreground py-2'>
                <div className='border border-slate-200 rounded px-1'>{itm.slugline}</div>
                &middot;
                <div>{itm.section}</div>
              </div>
              {itm?.publish && <div>{`${getLocalizedDate(new Date(itm.publish), locale)}`}</div>}
            </div>
            {i !== documents.length && <Separator />}
          </div>
        )
      }
      )}
    </div>
  )
}


Latest.meta = meta
