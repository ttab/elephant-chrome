import { useRef, useState, type JSX } from 'react'
import { useQuery } from '@/hooks/useQuery'
import { Button, Input } from '@ttab/elephant-ui'
import { SlidersHorizontalIcon } from '@ttab/elephant-ui/icons'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import { useTranslation } from 'react-i18next'
import {
  AdvancedSearchDialog,
  planningsFields,
  eventsFields,
  articlesFields
} from '@/components/AdvancedSearch'
import type { AdvancedSearchState, SearchFieldConfig } from '@/components/AdvancedSearch'
import { useAdvancedSearchParams } from '@/components/AdvancedSearch/hooks/useAdvancedSearchParams'

const fieldsByType: Record<SearchKeys, SearchFieldConfig[]> = {
  plannings: planningsFields,
  events: eventsFields,
  articles: articlesFields
}

export const SearchBar = ({ searchType, width }: {
  searchType: SearchKeys
  page: number
  width?: string
}): JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [query, setQueryString] = useQuery()
  const { t } = useTranslation('views')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fields = fieldsByType[searchType]
  const {
    state: advancedState,
    isAdvancedActive,
    applyAdvancedSearch,
    clearAdvancedSearch
  } = useAdvancedSearchParams(query, fields, setQueryString)

  function handleApply(state: AdvancedSearchState) {
    applyAdvancedSearch(state)
  }

  function handleClear() {
    clearAdvancedSearch()
  }

  return (
    <div className={`flex items-center gap-1 min-w-0 ${isAdvancedActive ? '' : (width ?? 'w-[200px] md:w-[300px] lg:w-[400px]')}`}>
      {!isAdvancedActive && (
        <form
          ref={formRef}
          className='flex-1'
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
              : t('search.placeholders.search')}
            ref={inputRef}
            name='search'
          />
        </form>
      )}

      <Button
        variant='ghost'
        size='xs'
        onClick={() => setDialogOpen(true)}
        className='h-9 w-9 shrink-0'
      >
        <SlidersHorizontalIcon size={18} strokeWidth={1.75} />
      </Button>

      <AdvancedSearchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fields={fields}
        state={advancedState}
        onApply={handleApply}
        onClear={handleClear}
      />
    </div>
  )
}

export { fieldsByType }
