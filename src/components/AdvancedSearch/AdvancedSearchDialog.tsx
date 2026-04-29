import { useEffect, useState, type JSX } from 'react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ToggleGroup,
  ToggleGroupItem
} from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { StructuredMode } from './StructuredMode'
import { QuerySyntaxMode } from './QuerySyntaxMode'
import { createDefaultState, isActiveState } from './lib/defaultState'
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
    setDraft(createDefaultState(fields))
  }

  function handleModeChange(value: string) {
    if (value === 'structured' || value === 'querySyntax') {
      setDraft({ ...draft, mode: value })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='flex flex-row items-center justify-between space-y-0'>
          <DialogTitle>{t('advancedSearch.title')}</DialogTitle>
          <DialogClose asChild>
            <Button variant='ghost' className='w-8 h-8 p-0'>
              <XIcon size={18} strokeWidth={1.75} />
            </Button>
          </DialogClose>
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

          <div className='pt-2 border-t'>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t('advancedSearch.namePlaceholder')}
              className='text-sm'
            />
          </div>
        </div>

        <DialogFooter className='flex flex-row sm:justify-between justify-between gap-2 pt-4'>
          <Button variant='outline' onClick={handleClear}>
            {t('advancedSearch.clear')}
          </Button>
          <Button onClick={handleApply} disabled={!isActiveState(draft) && !isActiveState(state)}>
            {t('advancedSearch.search')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
