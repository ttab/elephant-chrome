import React from 'react'
import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import apiClient from '@/lib/apiclient'
import { type ViewMetadata } from '@/types'
import { Button } from '@ttab/elephant-ui'
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

function ImageSearchResult(props: SearchResultProps): JSX.Element {
  const { children, total } = props
  return (
    <div className='h-full flex flex-col p-2 gap-4'>
      <p className='text-sm'>Antal träffar: {total}</p>
      <div
        className='grid grid-cols-2 md:grid-cols-3 gap-4'
      >
        {children}
      </div>
    </div>
  )
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
      className="self-center w-full p-2 flex flex-row gap-4"
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

const fetcher = async (queryKey: string) => {
  console.log('XXX url', queryKey)
  const queryObject = JSON.parse(queryKey)
  const { query, fromIndex, size } = queryObject
  const client = await apiClient(undefined, undefined)
  const res = await client.content.search('image', { q: query, s: size, fr: fromIndex * size })
  return res
}

// const getKey = (pageIndex, previousPageData) => {
//   if (previousPageData && !previousPageData.length) return null // reached the end
//   return `/users?page=${pageIndex}&limit=10`                    // SWR key
// }
function ImageSearch(): JSX.Element {
  const [queryString, setQueryString] = useState('')
  // const { data, size, setSize } = useSWRInfinite(
  const swr = useSWRInfinite(
    (index, prevData) => {
      console.log('XXX prevData', prevData)
      return JSON.stringify({ swrKey: '', query: queryString, fromIndex: index, size: 4 })
    },
    fetcher
  )

  console.log('XXX data', data)

  return (
    <div className='flex flex-col gap-3'>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {/* <ViewHeader.Title icon={XIcon} /> */}
          <ImageSearchInput setQueryString={setQueryString} />
          <XIcon />
        </ViewHeader.Content>
      </ViewHeader.Root>

      {/* <Button onClick={() => setSize(size + 1)} /> */}
      <ImageSearchResult total={ 0}>
        <InfiniteScroll
          swr={swr}
        loadingIndicator={<div>Loading...</div>}
        isReachingEnd={(swr) =>
          false
          // swr.data?.length === 0 || (swr.data?.[swr.data?.length - 1]?.length ?? 0) < PAGE_SIZE
        }
        >


        {(data) => {


          console.log('XXX data', data)
          return (<div>result</div>)

            // data?.map(hitres => {
            //   return hitres.hits.map((hit: { uri?: string }) => {
            //     const objectID = hit?.uri?.split('/')[5]
            //     console.log('🍄 ~ {hits.hits.map ~ objectID 🤭 -', objectID)
            //     return (
            //       <div key={hit.uri} className='bg-gray-200'>
            //         <a href={`https://stage.tt.se/bild/o/${objectID}`}>
            //           <img
            //             src={`${hit.uri}_NormalThumbnail.jpg`}
            //             className='h-32 max-w-full rounded-lg'
            //           />
            //         </a>
            //       </div>
            //     )
            //   })
            // })

          }
        }
        </InfiniteScroll>
      </ImageSearchResult>
    </div>
  )
}

ImageSearch.meta = meta

export { ImageSearch }
