import { useCallback, useEffect, useRef } from 'react'
import { type SearchIndexResponse } from '@/lib/index'
import { useSession } from 'next-auth/react'
import { type Session } from 'next-auth'
import { useIndexUrl } from './useIndexUrl'
import { useTable } from './useTable'

interface FetchOptions {
  size: number
  where: {
    start: string
    end: string
  }
}

export interface Fetcher<T> {
  search: (url: URL, token: string, options: FetchOptions) => Promise<SearchIndexResponse<T>>
}

export interface SourceAddtions {
  _source: {
    created: string[]
    current_version: string[]
    'document.language': string[]
    'document.meta.status': string[]
  }
}

const getCurrentDocumentStatus = <T extends SourceAddtions>(obj: T): string => {
  const item: Record<string, null | string[]> = obj._source
  const defaultStatus = 'draft'
  const createdValues = []
  for (const key in item) {
    if (Array.isArray(item[key])) {
      if (Object.prototype.hasOwnProperty.call(item, key) && key.startsWith('heads.')) {
        let newkey = key.split('heads.')[1]
        if (newkey.includes('.created')) {
          newkey = newkey.replace('.created', '')
          const [dateCreated] = item[key]
          createdValues.push({ status: newkey, created: dateCreated })
        }
      }
    }
  }
  createdValues.sort((a, b) => a?.created > b?.created ? -1 : 1)
  return createdValues[0]?.status || defaultStatus
}

export const useFetcher = <T extends SourceAddtions>(Fetcher: Fetcher<T>):
({ from, to }: { from: string, to: string })
=> Promise<SearchIndexResponse<T> | undefined> => {
  const { data: session } = useSession()
  const sessionRef = useRef<Session | null>(session)
  const { setData } = useTable<T>()

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const indexUrl = useIndexUrl()

  return useCallback(
    async ({ from, to }: {
      from: string
      to: string
    }): Promise<SearchIndexResponse<T> | undefined> => {
      const currentSession = sessionRef.current
      if (!currentSession) return undefined

      const searchUrl = new URL(indexUrl)

      const result = await Fetcher.search(searchUrl, currentSession.accessToken, {
        size: 100,
        where: { start: from, end: to }
      })


      if (result.ok) {
        const itemsWithStatus = {
          ...result,
          hits: result?.hits?.map((item) => {
            const status = getCurrentDocumentStatus(item)
            item._source = {
              ...item._source,
              'document.meta.status': [status]
            }
            return item
          })
        }


        setData(itemsWithStatus)
        return itemsWithStatus
      }
    },
    [Fetcher, indexUrl, setData]
  )
}
