import React from 'react'
import { ViewHeader } from '@/components'
// import { useSession } from '@/hooks'
import apiClient from '@/lib/apiclient'
import { type ViewMetadata } from '@/types'
import { XIcon, SearchIcon, LoaderIcon, ImageIcon, ListEndIcon } from '@ttab/elephant-ui/icons'
import { useState, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'
import InfiniteScroll from './InfiniteScroll'
import { ttninjs } from '@ttab/api-client'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { Preview } from './Preview'
import { AnyNaptrRecord } from 'dns'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className='flex'>
        {/* <SearchIcon/> */}
        <input
          type={type}
          className='flex h-10
            w-full
            border-input
            bg-background
            px-3 py-0 ring-offset-background
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:0
            disabled:cursor-not-allowed
            disabled:opacity-50'
          ref={ref}
          {...props}
        />
        <div className='absolute inset-y-0 left-2 pl-3 flex items-center pointer-events-none'>
          <SearchIcon />
        </div>

      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
interface SearchResultProps {
  total: number
  children: React.ReactNode
}

interface InputProps {
  setQueryString: any
}

const meta: ViewMetadata = {
  name: 'ImageSearch',
  path: `${import.meta.env.BASE_URL || ''}/imagesearch`,
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



function ImageSearchInput(props: InputProps): JSX.Element {
  const { setQueryString } = props
  // const { jwt } = useSession()
  const [query, setQuery] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setQueryString(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="self-center w-full p-2 flex flex-row"
    >
      <SearchInput
        className="p-2 w-full text-sm border-none focus:border-none"
        type="text"
        placeholder='Sök bild'
        name="imagesearch"
        ref={inputRef}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
    </form>
  )
}

// const fetcher2 = ([queryString, index, SIZE]) => {
//   return apiClient(undefined, undefined)
//     .then((client) => client.content.search('image', { q: queryString, s: SIZE, fr: (index) * SIZE }))
//     .then((res) => res)
// }

const fetcher = async ([queryString, index, SIZE]: [queryString: string, index: number, SIZE: number]) => {
  console.log('XXX fetch query', queryString, index)
  const client = await apiClient(undefined, undefined)
  const res = await client.content.search('image', { q: queryString, s: SIZE, fr: (index) * SIZE })
  return res
}

function ImageSearchResult(props: SearchResultProps): JSX.Element {
  const { children } = props
  return (
    <div className='h-screen max-h-screen flex flex-col p-2 overflow-auto'>
      <div className='relative h-full grid grid-cols-2 md:grid-cols-3 gap-1'>
        {children}
      </div>
    </div>
  )
}

interface rendition {
    usage: string
    variant: string
    href: string
    mimetype: string
    width: number
    height: number
}
interface renditions {
  [name: string]: rendition
}

export const findRenditionByUsageAndVariant = (renditions: renditions, usage = 'Thumbnail', variant = 'Normal') : rendition => {
  const matchingRenditions = Object.values(renditions).filter((rendition) => {
    return rendition?.usage === usage && rendition?.variant === variant
  })

  if (matchingRenditions.length > 0) {
    return matchingRenditions[0]
  } else {
    return {
      usage,
      variant,
      href: 'not found',
      mimetype: 'image/jpeg',
      width: 0,
      height:0
    }
  }
}

interface ThumbnailProps {
  hit: ttninjs

}
function Thumbnail(props: ThumbnailProps): JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null)
  const { hit } = props
  const renditions = hit.renditions as renditions
  const thumbnail = findRenditionByUsageAndVariant(renditions, 'Thumbnail', 'Normal')
  const preview = findRenditionByUsageAndVariant(renditions, 'Preview', 'Watermark')

  return (

    <Dialog modal={false} >
      <DialogTrigger>
        <div className='flex place-content-center  bg-gray-200' style={{ minHeight: '144px' }}>
          <img
            // src={`${hit.uri}_NormalThumbnail.jpg`}
            src={thumbnail.href}
            // className='h-32 max-w-full'
            style={{ maxHeight: '176px', objectFit: 'contain', maxWidth: 'auto' }}
            onDragStartCapture={(e) => {
              console.log('dragging the image', e)
              const el = imageRef.current
              if (el) {
                // Create cloned element to force as drag image
                const clone = el.cloneNode(true) as HTMLDivElement
                const { left, top } = el.getBoundingClientRect()

                clone.style.width = `${el.offsetWidth}px`
                clone.style.height = `${el.offsetHeight}px`

                document.body.appendChild(clone)

                el.style.opacity = '0.5'
                e.dataTransfer.clearData()

                const image = {
                  byline: hit.byline,
                  text: hit.headline,
                  href: preview.href,
                  altText: hit?.description_text || ''
                }

                e.dataTransfer.setData('tt/visual-ex', JSON.stringify(image))
                e.dataTransfer.setDragImage(
                  clone,
                  (e.clientX - left) * 0.2,
                  (e.clientY - top) * 0.2
                )
              }
            }}

            onDragEndCapture={() => {
              const el = imageRef.current
              if (el) {
                el.style.opacity = '1'
              }
            }}
          />
        </div>
      </DialogTrigger>
      <DialogContent><Preview ttninjs={hit}/></DialogContent>
    </Dialog>


  )
}
function ImageSearch(): JSX.Element {
  const [queryString, setQueryString] = useState('')
  const SIZE = 10
  const swr = useSWRInfinite(
    (index, prevData) => {
      return [queryString, index, SIZE]
    },
    fetcher,
    {
      revalidateFirstPage: false
    }
  )

  return (
    <div className='h-screen max-h-screen flex flex-col relative'>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {/* <ViewHeader.Title icon={XIcon} /> */}
          <ImageSearchInput setQueryString={setQueryString} />
          <XIcon />
        </ViewHeader.Content>
      </ViewHeader.Root>

      <ImageSearchResult total={0}>
        <InfiniteScroll
          swr={swr}
          loadingIndicator={<LoaderIcon size={'50%'} color='#9ca3af' strokeWidth='1' />}
          endingIndicator={<ListEndIcon size={'50%'} color='#9ca3af' strokeWidth='1' />}
          isReachingEnd={(swr) =>
            swr.data?.[0].hits.length === 0 || (swr.data?.[swr.data?.length - 1]?.hits.length ?? 0) < SIZE
          }
        >
          {(data) =>
            data.hits.map((hit) => {
              return (
                <Thumbnail key={hit.uri} hit={hit} />
              )
            })

          }
        </InfiniteScroll>
      </ImageSearchResult>
      {/* <div className="h-14 basis-14">Antal: XXX</div> */}

    </div>
  )
}

ImageSearch.meta = meta

export { ImageSearch }
