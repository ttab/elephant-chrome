import { type MouseEvent, useCallback, useRef, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { useSession } from 'next-auth/react'
import { useIndexUrl } from '@/hooks/useIndexUrl'
import { useLink } from '@/hooks/useLink'
import { useRegistry } from '@/hooks/useRegistry'
import { type Factbox as FactboxSchema } from '@/lib/index/schemas/factbox'
import { Factbox } from '@/lib/index'
import { getFactboxRowValue } from './getFactboxRowValue'
import { ViewHeader } from '@/components'
import { SearchInput } from '@/components/SearchInput'
import { Badge, Button, Tooltip } from '@ttab/elephant-ui'
import { FileInput, PlusIcon } from '@ttab/elephant-ui/icons'
import { dateToReadableDateTime } from '@/lib/datetime'
import { formatModified } from '@/lib/formatModified'

const meta: ViewMetadata = {
  name: 'Factboxes',
  path: `${import.meta.env.BASE_URL || ''}/factboxes`,
  widths: {
    sm: 12,
    md: 3,
    lg: 3,
    xl: 3,
    '2xl': 3,
    hd: 3,
    fhd: 3,
    qhd: 3,
    uhd: 3
  }
}

interface FBItem {
  factbox: FactboxSchema
  openFactbox: <T extends HTMLElement>(e: MouseEvent<T>, f: FactboxSchema) => void
  locale: string
  timeZone: string
}

interface Message {
  type?: 'info' | 'error'
  text?: string
}

interface FactboxContentI {
  factboxes: FactboxSchema[]
  loading: boolean
  message: Message
}

const FactboxItem = ({ factbox, openFactbox, locale, timeZone }: FBItem): JSX.Element => {
  const [title] = getFactboxRowValue(factbox, 'document.title')
  const [text] = getFactboxRowValue(factbox, 'document.content.core_text.data.text')
  const [modified] = getFactboxRowValue(factbox, 'modified')
  const modifiedFormatted = formatModified(modified)
  const convertedDate = dateToReadableDateTime(new Date(modified), locale, timeZone, { includeYear: true })
  const factboxRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={factboxRef}
      className='w-full px-4 py-2 text-left flex justify-between items-center'
      onDragStartCapture={(e) => {
        e.stopPropagation()
        if (!factboxRef.current) {
          return
        }

        const el = factboxRef.current
        const clone = el.cloneNode(true) as HTMLDivElement

        clone.style.width = `${el.offsetWidth}px`
        clone.style.height = `${el.offsetHeight}px`

        document.body.appendChild(clone)

        el.style.opacity = '0.5'
        e.dataTransfer.clearData()

        e.dataTransfer.setData('core/factbox', JSON.stringify({ title, text, modified: modifiedFormatted }))
      }}
      onDragEndCapture={() => {
        const el = factboxRef.current
        if (el) {
          el.style.opacity = '1'
        }
      }}
    >
      <div className='w-3/4 flex flex-col' draggable>
        <p className='w-full truncate text-sm font-bold'>{title}</p>
        <p className='w-full truncate text-xs'>{text}</p>
        {modified ? <p className='w-full truncate text-xs'><em>Senast ändrad {convertedDate}</em></p> : null}
      </div>
      <a onClick={(e) => openFactbox(e, factbox)} className='cursor-pointer flex items-center p-2 rounded-md  hover:bg-gray-100'>
        <Tooltip content={'Redigera för alla'}>
          <FileInput size={18} strokeWidth={1.75} />
        </Tooltip>
      </a>
    </div>
  )
}

const FactboxContent = ({ factboxes = [], loading, message }: FactboxContentI): JSX.Element => {
  const openFactboxEditor = useLink('Factbox')
  const { locale, timeZone } = useRegistry()

  const openFactbox = useCallback(<T extends HTMLElement>(event: MouseEvent<T>, factbox: FactboxSchema) => {
    event.preventDefault()
    event.stopPropagation()
    if (factbox._id) {
      openFactboxEditor(event, {
        id: factbox._id
      })
    }
  }, [openFactboxEditor])

  return (
    <>
      <div>
        <Button onClick={(event) => {
          const id = crypto.randomUUID()
          function onDocumentCreated(): void {}
          openFactboxEditor(event, { id }, { onDocumentCreated })
        }}>
          <PlusIcon size={18} strokeWidth={1.75} /> Ny
        </Button>
      </div>
      <div className='h-screen max-h-screen flex flex-col gap-2 divide-y divide-slate-600'>
        {factboxes?.length > 0
          ? factboxes?.map((factbox: FactboxSchema) => (
            <FactboxItem
              key={factbox._id}
              factbox={factbox}
              openFactbox={openFactbox}
              locale={locale}
              timeZone={timeZone}
            />
          ))
          : null}
        {message?.text
          ? (
            <div className='m-4'>
              <Badge
                variant={message.type === 'error' ? 'destructive' : 'secondary'}
                className='p-2 rounded-md w-fit'
                >
                <div className='rounded-full flex justify-center items-center h-fit'>
                  <div
                    className='text-muted-foreground text-sm font-sans font-normal whitespace-nowrap text-ellipsis'
                    >{message?.text}</div>
                </div>
              </Badge>
            </div>
            )
          : null}
        {loading && <p>Söker...</p>}
      </div>
    </>
  )
}

export const Factboxes = (): JSX.Element => {
  const { data: session, status } = useSession()
  const indexUrl = useIndexUrl()
  const inputRef = useRef<HTMLInputElement>(null)
  const [factboxes, setFactboxes] = useState<FactboxSchema[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<Message>({})

  const fetchData = async (inputValue: string): Promise<FactboxSchema[] | undefined> => {
    try {
      if (status !== 'authenticated' || !indexUrl) {
        return
      }
      setMessage({})
      setLoading(true)
      const response = await Factbox.search(indexUrl, session?.accessToken, {
        query: {
          query: {
            prefix: {
              'document.content.core_text.data.text': {
                value: inputValue
              }
            }
          },
          sort: [
            {
              _score: 'desc'
            }
          ]
        }
      })
      if (response.ok) {
        if (response?.hits?.length === 0) {
          setMessage({ type: 'info', text: 'Inga träffar' })
        }
        return response?.hits
      }
    } catch (error) {
      console.error('Error while getting factboxes', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-screen max-h-screen flex flex-col p-2 overflow-auto gap-2'>
      <ViewHeader.Root>
        <ViewHeader.Content>
          <form className='grow' onSubmit={(e): void => {
            void (async () => {
              e.preventDefault()
              const value: string | undefined = inputRef?.current?.value
              if (!value) {
                return
              }
              try {
                const data = await fetchData(value)
                setFactboxes(data || [])
              } catch (error) {
                if (error instanceof Error) {
                  setMessage({ type: 'error', text: error?.message })
                } else {
                  setMessage({ type: 'error', text: String(error) })
                }
              }
            })()
          }}
          >
            <SearchInput
              className="p-4 w-full text-sm border-none focus:border-none"
              type="text"
              placeholder='Sök faktaruta'
              name="factboxes"
              ref={inputRef}
            />
          </form>
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>
      <FactboxContent factboxes={factboxes} loading={loading} message={message} />
    </div>
  )
}

Factboxes.meta = meta
