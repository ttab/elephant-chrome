import React, { useState } from 'react'
import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { Loader, ListEnd, Image } from '@ttab/elephant-ui/icons'
import useSWRInfinite from 'swr/infinite'
import InfiniteScroll from './InfiniteScroll'
import { Thumbnail } from './Thumbnail'
import { ImageSearchInput } from './SearchInput'
import { SWRConfig } from 'swr'
import { createFetcher } from './lib/fetcher'
import { useRegistry } from '@/hooks/useRegistry'
import { type ttninjs } from '@ttab/api-client'
import { useSession } from 'next-auth/react'

export type MediaTypes = 'image' | 'graphic'

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
      <div className='relative grid grid-cols-2 md:grid-cols-3 gap-1'>
        {children}
      </div>
    </div>
  )
}

export const ImageSearch = (): JSX.Element => {
  const { server: { contentApiUrl } } = useRegistry()
  const { data: session } = useSession()
  const [mediaType, setMediaType] = useState<MediaTypes>('image')

  return (
    <SWRConfig value={{ fetcher: createFetcher(contentApiUrl, session) }}>
      <ImageSearchContent />
    </SWRConfig>
  )
}

const ImageSearchContent = ({
  setMediaType,
  mediaType
}: {
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
  mediaType: MediaTypes
}): JSX.Element => {
  const [queryString, setQueryString] = useState('')
  const SIZE = 10

  const swr = useSWRInfinite<{ hits: ttninjs[] }, Error>(
    (index) => {
      return [queryString, index, SIZE]
    },
    {
      revalidateFirstPage: false
    }
  )

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='ImageSearch'
          title='Bilder'
          icon={Image}
        />
        <ViewHeader.Content>
          <ImageSearchInput setQueryString={setQueryString} setMediaType={setMediaType} />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content>
        <ImageSearchResult total={0}>
          <InfiniteScroll
            swr={swr}
            loadingIndicator={<Loader size='32' color='#9ca3af' strokeWidth='2' />}
            endingIndicator={<ListEnd size='32' color='#9ca3af' strokeWidth='2' />}
            isReachingEnd={(swr) =>
              swr.data?.[0].hits.length === 0 || (swr.data?.[swr.data?.length - 1]?.hits.length ?? 0) < SIZE}
          >
            {(data) =>
              data.hits.map((hit) => (
                <Thumbnail key={hit.uri} hit={hit} />
              ))}
          </InfiniteScroll>
        </ImageSearchResult>
      </View.Content>
    </View.Root>
  )
}

ImageSearch.meta = meta
