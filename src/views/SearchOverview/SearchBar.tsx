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

    // A search should initiate when user changes search type, hence
    // conducting a search if the user only flips between types without entering a query text or
    // selecting a filter makes for unnecessary api calls.
    const params = Object.keys(query)
    if (!params.length || (params.length === 1 && params[0] === 'type')) {
      return
    }

    search({
      text,
      page,
      setLoading,
      setTotalHits,
      searchType,
      accessToken,
      indexUrl,
      setData,
      status,
      query
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
          status,
          query
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
