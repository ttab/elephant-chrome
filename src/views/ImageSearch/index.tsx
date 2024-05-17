import React from 'react'
import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import apiClient from '@/lib/apiclient'
import { type ViewMetadata } from '@/types'
// import { Button, Input } from '@ttab/elephant-ui'
import { XIcon, SearchIcon } from '@ttab/elephant-ui/icons'
import { useState, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'


interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className='flex'>
        {/* <SearchIcon/> */}

        <input
          type={type}
          className='
            flex h-10
            w-full
            border-input
            bg-background
            ring-offset-background
            px-2 py-0
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:0
            disabled:cursor-not-allowed
            disabled:opacity-50'
          ref={ref}
          {...props}
        />
        <div className='absolute inset-y-0 left-1 pl2 flex items-center pointer-events-none'>
          <SearchIcon />
        </div>

      </div>
    )
  }
)

interface Result {
  hits: object[]
  total: number
}

interface SearchResultProps {
  total?: number
  children: React.ReactNode
}

interface InputProps {
  // setSearchResult: React.Dispatch<React.SetStateAction<Result>>
  setQuery: any
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
  const { setQuery } = props
  const { jwt } = useSession()
  // const [query, setQuery] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)



  // const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
  //   e.preventDefault()
  //   async function imageSearch(query: string): Promise<object> {
  //     if (jwt?.access_token) {
  //       console.log('jwt?.access_token', jwt?.access_token)
  //       const client = await apiClient(jwt?.accessToken, undefined)
  //       const result = await client.content.search('image', { q: query, s: 10 })

  //       if (result?.hits) {
  //         setSearchResult(result)
  //         return result?.hits
  //       }
  //     }
  //     return {}
  //   }

  //   if (inputRef.current) {
  //     imageSearch(inputRef.current.value)
  //       .catch(error => console.error('Image search error:', error))
  //   }
  // }

  return (
    <form
      // onSubmit={handleSubmit}
      className="self-center w-full p-2 flex flex-row gap-4"
    >
      <SearchInput
        className="p-2 w-full text-sm border-none focus:border-none"
        type="text"
        placeholder='Sök bild...'
        name="imagesearch"
        ref={inputRef}
        onChange={(e) => setQuery({q: e.currentTarget.value, fr: 0, s: 20})}
      />
    </form>
  )
}

// const getKey = (query, previousPageData) => {
//   if (previousPageData && !previousPageData.length) return null // reached the end
//   return JSON.stringify(query)                // SWR key
// }

const fetcher = (key, index) => {
  const query = JSON.parse(key)
  apiClient(null, undefined).then(client => {
    client.content.search('image', query).then(result => {
      return result
    })
  })
}

function ImageSearch(): JSX.Element {
  // const [hits, setSearchResult] = useState<{ hits: object[], total: number }>({ hits: [], total: 0 })
  const [query, setQuery ] = useState({q: '', fr: 0, s: 20})
  // console.log('result', hits)

  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite(
    index => [JSON.stringify(query), index],
    fetcher
  )

  console.log('XXX data', data)

  // https://api.stage.tt.se/
  // content/v1/image/search?q=hus&pubstatus=usable&s=20&sort=date%3Adesc&layout=full

  return (
    <div className='flex flex-col gap-3'>
      <ViewHeader.Root>
        <ViewHeader.Content>
        {/* <ViewHeader.Title icon={XIcon} /> */}
          <ImageSearchInput setQuery={setQuery}  />
          <XIcon />
        </ViewHeader.Content>
      </ViewHeader.Root>


      <ImageSearchResult total={data?.length}>
        {/* {hits.hits.map((hit: { uri?: string }) => {
          const objectID = hit.uri.split('/')[5]
          console.log('🍄 ~ {hits.hits.map ~ objectID 🤭 -', objectID)
          return (
            <div key={hit.uri} className='bg-gray-200'>
              <a href={`https://stage.tt.se/bild/o/${objectID}`}>
                <img
                  src={`${hit.uri}_NormalThumbnail.jpg`}
                  className='h-32 max-w-full rounded-lg'
                />
              </a>
            </div>
          )
        })} */}
        retrurn (<h2>Result to come</h2>)
      </ImageSearchResult>
    </div>
  )
}

ImageSearch.meta = meta

export { ImageSearch }
