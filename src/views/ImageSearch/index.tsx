import React, { type Dispatch, type SetStateAction, useState, useMemo, type JSX } from 'react'
import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { LoaderIcon, ListEndIcon, ImageIcon, TriangleAlertIcon, RotateCcwIcon, SearchIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import useSWRInfinite from 'swr/infinite'
import InfiniteScroll from './InfiniteScroll'
import { Thumbnail } from './Thumbnail'
import { ImageSearchInput } from './SearchInput'
import { SWRConfig } from 'swr'
import { createTTFetcher } from './lib/ttFetcher'
import { createNTBFetcher } from './lib/ntbFetcher'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import type { ImageSearchResult as SearchResult } from './lib/types'
import { Error } from '../Error'
import { useTranslation } from 'react-i18next'

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
      <div className='relative grid grid-cols-2 @md/view:grid-cols-3 @2xl/view:grid-cols-4 @4xl/view:grid-cols-6 @6xl/view:grid-cols-8 gap-2'>
        {children}
      </div>
    </div>
  )
}

export const ImageSearch = (): JSX.Element => {
  const { server: { imageSearchUrl }, envs: { imageSearchProvider }, ntb } = useRegistry()
  const { data: session } = useSession()
  const [mediaType, setMediaType] = useState<MediaTypes>('image')

  const fetcher = useMemo(() => {
    if (ntb) {
      return createNTBFetcher(ntb, session, 'ntb')
    }

    if (imageSearchProvider === 'tt') {
      return createTTFetcher(imageSearchUrl, session, mediaType)
    }
  }, [ntb, session, imageSearchUrl, mediaType, imageSearchProvider])

  if (!imageSearchProvider || !fetcher) {
    return <Error title='Bildsökningsleverantör saknas' message='Ingen bildsökningsleverantör är konfigurerad' />
  }

  return (
    <SWRConfig value={{ fetcher, shouldRetryOnError: false }}>
      <ImageSearchContent
        setMediaType={setMediaType}
        mediaType={mediaType}
        isNtb={!!ntb}
      />
    </SWRConfig>
  )
}

const ImageSearchContent = ({
  setMediaType,
  mediaType,
  isNtb
}: {
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
  mediaType: MediaTypes
  isNtb: boolean
}): JSX.Element => {
  const [queryString, setQueryString] = useState('')
  const SIZE = 10
  const { t } = useTranslation('views')

  const swr = useSWRInfinite<SearchResult, Error>(
    (index) => {
      return [queryString, index, SIZE, mediaType]
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
          title={t('imageSearch.title')}
          icon={ImageIcon}
        />
        <ViewHeader.Content>
          <ImageSearchInput
            setQueryString={setQueryString}
            setMediaType={setMediaType}
            isNtb={isNtb}
          />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content>
        {swr.error && (
          <div className='mx-3 mt-3 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/30'>
            <TriangleAlertIcon size={16} strokeWidth={1.75} className='shrink-0 text-red-500 dark:text-red-400' />
            <span className='flex-1 text-sm text-red-700 dark:text-red-300'>
              Bildsökningen misslyckades
            </span>
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 gap-1.5 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40'
              onClick={() => void swr.mutate()}
            >
              <RotateCcwIcon size={13} strokeWidth={1.75} />
              Försök igen
            </Button>
          </div>
        )}
        <ImageSearchResult total={0}>
          <InfiniteScroll
            swr={swr}
            loadingIndicator={<LoaderIcon size='32' color='#9ca3af' strokeWidth='2' />}
            endingIndicator={
              swr.data?.[0]?.hits.length === 0
                ? (
                    <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                      <SearchIcon size={24} strokeWidth={1.75} />
                      <span className='text-sm'>Inga resultat</span>
                    </div>
                  )
                : <ListEndIcon size='32' color='#9ca3af' strokeWidth='2' />
            }
            isReachingEnd={(swr) =>
              swr.data?.[0]?.hits.length === 0
              || (swr.data?.[swr.data?.length - 1]?.hits.length ?? 0) < SIZE}
          >
            {(data) =>
              data.hits.map((hit) => (
                <Thumbnail key={hit.id} hit={hit} />
              ))}
          </InfiniteScroll>
        </ImageSearchResult>
      </View.Content>
    </View.Root>
  )
}

ImageSearch.meta = meta
