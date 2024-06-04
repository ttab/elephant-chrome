import React from 'react'
import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import apiClient from '@/lib/apiclient'
import { type ViewMetadata } from '@/types'
import { XIcon, SearchIcon } from '@ttab/elephant-ui/icons'
import { useState, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'
import InfiniteScroll from './InfiniteScroll'

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

// interface Result {
//   hits: object[]
//   total: number
// }

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
  const { jwt } = useSession()
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
            loadingIndicator={<div>Loading...</div>}
            endingIndicator={<div>Ending</div>}
            isReachingEnd={(swr) =>
              swr.data?.[0].hits.length === 0 || (swr.data?.[swr.data?.length - 1]?.hits.length ?? 0) < SIZE
            }
          >
            {(data) =>
              data.hits.map((hit: { uri?: string }) => {
                const objectID = hit?.uri?.split('/')[5]
                return (
                  <div key={hit.uri} className='bg-gray-200'>
                    <a href={`https://stage.tt.se/bild/o/${objectID}`} className='flex place-content-center'>
                      <img
                        src={`${hit.uri}_NormalThumbnail.jpg`}
                        className='h-32 max-w-full'
                        // style={{maxHeight: '100%', width: 'auto'}}
                        // className=''
                      />
                    </a>
                  </div>
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
