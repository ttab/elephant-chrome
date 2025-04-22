import { type SetStateAction, useRef, useEffect } from 'react'
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
import { Input } from '@ttab/elephant-ui'
import type { SearchType } from './SearchDropdown'

export const SearchBar = ({ setLoading, setTotalHits, searchType, page, width }: {
  setLoading: React.Dispatch<SetStateAction<boolean>>
  setTotalHits: React.Dispatch<SetStateAction<number>>
  searchType: SearchType
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
    const text = typeof query?.query === 'string'
      ? query.query
      : inputRef?.current?.value

    search({
      text,
      page,
      setLoading,
      setTotalHits,
      searchType,
      accessToken,
      indexUrl,
      setData,
      status
    })
  }, [page, indexUrl, accessToken, query, searchType, status, setLoading, setData, setTotalHits])

  useEffect(() => {
    formRef?.current?.reset()
    inputRef?.current?.focus()
  }, [searchType])


  return (
    <form
      ref={formRef}
      className={width ? width : 'w-[200px]'}
      onSubmit={(e): void => {
        e.preventDefault()
        const text = inputRef?.current?.value
        setQueryString({ type: searchType, query: text })

        search({
          text,
          page,
          setLoading,
          setTotalHits,
          searchType,
          accessToken,
          indexUrl,
          setData,
          status
        })
      }}
    >
      <Input
        autoFocus
        placeholder={typeof query?.query === 'string'
          ? query.query
          : 'Sök'}
        ref={inputRef}
        name='search'
      />
    </form>
  )
}
