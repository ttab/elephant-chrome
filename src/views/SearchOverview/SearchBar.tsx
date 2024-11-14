import { type SetStateAction, useRef, useEffect } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { useIndexUrl } from '@/hooks/useIndexUrl'
import { useSession } from 'next-auth/react'
import { useTable } from '@/hooks/useTable'
import { search } from './search'
import {
  type Article,
  type Event,
  type Planning
} from '@/lib/index'
import { type AssignmentMetaExtended } from '../Assignments/types'
import { useQuery } from '@/hooks/useQuery'

export const SearchBar = ({ setLoading, setTotalHits, pool, page, width }: {
  setLoading: React.Dispatch<SetStateAction<boolean>>
  setTotalHits: React.Dispatch<SetStateAction<number>>
  pool: string
  page: number
  width?: string
}): JSX.Element => {
  const indexUrl = useIndexUrl()
  const { data: session, status } = useSession()
  const accessToken = session?.accessToken
  const { setData } = useTable<Planning | Event | AssignmentMetaExtended | Article>()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [query, setQueryString] = useQuery()

  useEffect(() => {
    const text = query?.query || inputRef?.current?.value
    search({
      text,
      page,
      setLoading,
      setTotalHits,
      pool,
      accessToken,
      indexUrl,
      setData,
      status
    })
  }, [page, indexUrl, accessToken, query.query, pool, status, setLoading, setData, setTotalHits])

  useEffect(() => {
    formRef?.current?.reset()
    inputRef?.current?.focus()
  }, [pool])


  return (
    <form
      ref={formRef}
      className={width ? width : 'w-[200px]'}
      onSubmit={(e): void => {
        e.preventDefault()
        const text = inputRef?.current?.value
        setQueryString({ type: pool, query: text })
        search({
          text,
          page,
          setLoading,
          setTotalHits,
          pool,
          accessToken,
          indexUrl,
          setData,
          status
        })
      }}
    >
      <SearchInput
        className='w-full flex p-4 text-sm focus:ring-1 focus:ring-indigo-200 focus:dark:ring-gray-600'
        type='text'
        placeholder={query?.query || 'Sök'}
        autoFocus
        name='search'
        ref={inputRef}
        withIcon={false}
      />
    </form>
  )
}
