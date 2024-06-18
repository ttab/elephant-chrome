import React, { useState } from 'react'
import { ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { XIcon, LoaderIcon, ListEndIcon } from '@ttab/elephant-ui/icons'
import useSWRInfinite from 'swr/infinite'
import InfiniteScroll from './InfiniteScroll'
import { Thumbnail } from './Thumbnail'
import { ImageSearchInput } from './SearchInput'
import { SWRConfig } from 'swr'
import { createFetcher } from './fun/fetcher'
import { useRegistry } from '@/hooks/useRegistry'
import { type ttninjs } from '@ttab/api-client'

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

const ImageSearchResult = ({ children }: {
  total: number
  children: React.ReactNode
}): JSX.Element => {
  return (
    <div className='h-screen max-h-screen flex flex-col p-2 overflow-auto'>
      <div className='relative h-full grid grid-cols-2 md:grid-cols-3 gap-1'>
        {children}
      </div>
    </div>
  )
}

export const ImageSearch = (): JSX.Element => {
  const { server: { contentApiUrl } } = useRegistry()

  return (
    <SWRConfig value={{ fetcher: createFetcher(contentApiUrl) }}>
      <ImageSearchContent />
    </SWRConfig>
  )
}

const ImageSearchContent = (): JSX.Element => {
  const [queryString, setQueryString] = useState('')
  const SIZE = 10

  const swr = useSWRInfinite(
    (index) => {
      return [queryString, index, SIZE]
    },
    {
      revalidateFirstPage: false
    }
  )

  return (
    <div className='h-screen max-h-screen flex flex-col relative'>
      <ViewHeader.Root>
        <ViewHeader.Content>
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
            data.hits.map((hit: ttninjs) => (
              <Thumbnail key={hit.uri} hit={hit} />
            ))
          }
        </InfiniteScroll>
      </ImageSearchResult>
    </div>
  )
}

ImageSearch.meta = meta
