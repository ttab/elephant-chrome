import { useEffect, useState, type JSX } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ToggleGroup,
  ToggleGroupItem
} from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'
import { StructuredMode } from './StructuredMode'
import { QuerySyntaxMode } from './QuerySyntaxMode'
import { isActiveState } from './lib/defaultState'
import type { AdvancedSearchDialogProps, AdvancedSearchState } from './types'

export const AdvancedSearchDialog = ({
  open,
  onOpenChange,
  fields,
  state,
  onApply,
  onClear
}: AdvancedSearchDialogProps): JSX.Element => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<AdvancedSearchState>(state)

  useEffect(() => {
    if (open) {
      setDraft(state)
    }
  }, [open, state])

  function handleApply() {
    if (!isActiveState(draft)) {
      onClear()
      onOpenChange(false)
      return
    }
    onApply(draft)
    onOpenChange(false)
  }

  function handleClear() {
    onClear()
    onOpenChange(false)
  }

  function handleModeChange(value: string) {
    if (value === 'structured' || value === 'querySyntax') {
      setDraft({ ...draft, mode: value })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('advancedSearch.title')}</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <ToggleGroup
            type='single'
            value={draft.mode}
            onValueChange={handleModeChange}
            className='justify-start'
          >
            <ToggleGroupItem value='structured' className='text-xs'>
              {t('advancedSearch.structured')}
            </ToggleGroupItem>
            <ToggleGroupItem value='querySyntax' className='text-xs'>
              {t('advancedSearch.querySyntax')}
            </ToggleGroupItem>
          </ToggleGroup>

          {draft.mode === 'structured'
            ? (
                <StructuredMode
                  state={draft.structured}
                  fields={fields}
                  onChange={(structured) => setDraft({ ...draft, structured })}
                />
              )
            : (
                <QuerySyntaxMode
                  state={draft.querySyntax}
                  fields={fields}
                  onChange={(querySyntax) => setDraft({ ...draft, querySyntax })}
                />
              )}
        </div>

        <DialogFooter className='flex flex-row sm:justify-between justify-between gap-2 pt-4'>
          <Button variant='outline' onClick={handleClear}>
            {t('advancedSearch.clear')}
          </Button>
          <div className='flex gap-2'>
            <Button variant='secondary' onClick={() => onOpenChange(false)}>
              {t('advancedSearch.cancel')}
            </Button>
            <Button onClick={handleApply}>
              {t('advancedSearch.search')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
