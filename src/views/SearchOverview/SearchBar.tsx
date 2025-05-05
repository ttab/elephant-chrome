import { useRef } from 'react'

import { useQuery } from '@/hooks/useQuery'
import { Input } from '@ttab/elephant-ui'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'

export const SearchBar = ({ searchType, width }: {
  searchType: SearchKeys
  page: number
  width?: string
}): JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [query, setQueryString] = useQuery()

  return (
    <form
      ref={formRef}
      className={width ? width : 'w-[200px]'}
      onSubmit={(e): void => {
        e.preventDefault()
        const text = inputRef?.current?.value
        setQueryString({ type: searchType, query: text })
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
