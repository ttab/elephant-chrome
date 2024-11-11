import { SetStateAction, useRef, useEffect } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { useIndexUrl } from '@/hooks/useIndexUrl'
import { useSession } from 'next-auth/react'
import {
  type Article,
  type Event,
  type Planning
} from '@/lib/index'
import { useTable } from '@/hooks/useTable'
import { type AssignmentMetaExtended } from '../Assignments/types'
import { search } from './search'

export const SearchBar = ({ setLoading, setTotalHits, pool, page }: {
  setLoading: React.Dispatch<SetStateAction<boolean>>,
  setTotalHits: React.Dispatch<SetStateAction<number>>,
  pool: string,
  page: number
 }): JSX.Element => {
  const indexUrl = useIndexUrl()
  const { data: session, status } = useSession()
  const { setData } = useTable<Planning | Event | AssignmentMetaExtended | Article>()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const text = inputRef?.current?.value
    search({
      text,
      page,
      setLoading,
      setTotalHits,
      pool,
      session,
      indexUrl,
      setData,
      status
    })
  }, [page])

  useEffect(() => {
    formRef?.current?.reset()
    inputRef?.current?.focus()
  }, [pool])


  return (
    <form
      ref={formRef}
      onSubmit={(e): void => {
        e.preventDefault()
        const text = inputRef?.current?.value
        search({
          text,
          page,
          setLoading,
          setTotalHits,
          pool,
          session,
          indexUrl,
          setData,
          status
        })
      }}
    >
      <SearchInput
        className="w-[200px] p-4 text-sm focus:ring-1 focus:ring-indigo-200 focus:dark:ring-gray-600"
        type="text"
        placeholder='Sök'
        autoFocus
        name="search"
        ref={inputRef}
        withIcon={false}
      />
    </form>
  )
}
