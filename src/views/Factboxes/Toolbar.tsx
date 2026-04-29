import { useState, type JSX } from 'react'
import { Button, Command } from '@ttab/elephant-ui'
import { SlidersHorizontalIcon } from '@ttab/elephant-ui/icons'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery } from '@/hooks/useQuery'
import { useTranslation } from 'react-i18next'
import { AdvancedSearchDialog, AdvancedSearchBadges, factboxFields } from '@/components/AdvancedSearch'
import { useAdvancedSearchParams } from '@/components/AdvancedSearch/hooks/useAdvancedSearchParams'

export const Toolbar = (): JSX.Element => {
  const [filter, setFilter] = useQuery()
  const { t } = useTranslation('shared')
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    state: advancedState,
    isAdvancedActive,
    applyAdvancedSearch,
    clearAdvancedSearch
  } = useAdvancedSearchParams(filter, factboxFields, setFilter)

  return (
    <div className='bg-table-bg flex items-center justify-between py-1 px-4 border-b sticky top-0 z-10'>
      <div className='flex flex-1 items-center space-x-2'>
        {!isAdvancedActive && (
          <Command className='[&_[cmdk-input-wrapper]]:border-none'>
            <DebouncedCommandInput
              value={typeof filter.query === 'string' ? filter.query : filter.query?.[0]}
              onChange={(value: string | undefined) => {
                if (value) {
                  setFilter({ query: [value] })
                } else {
                  setFilter({})
                }
              }}
              placeholder={t('toolbar.freeTextSearch')}
              className='h-9'
            />
          </Command>
        )}

        {isAdvancedActive && (
          <AdvancedSearchBadges
            state={advancedState}
            fields={factboxFields}
            onEdit={() => setDialogOpen(true)}
            onClear={clearAdvancedSearch}
          />
        )}
      </div>

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
        fields={factboxFields}
        state={advancedState}
        onApply={applyAdvancedSearch}
        onClear={clearAdvancedSearch}
      />
    </div>
  )
}
