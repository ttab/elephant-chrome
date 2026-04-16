import { Button, ButtonGroup, Tooltip } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'
import { BookOpenCheckIcon, CheckIcon, FolderDownIcon, Grid2X2PlusIcon, PlusIcon, SaveIcon } from '@ttab/elephant-ui/icons'

export const WiresToolbar = ({ disabled = false, onAddStream, onSaveStreams, onAction, onCreate, isDirty, hasMissingFilters = false }: {
  disabled?: boolean
  onAddStream: () => void
  onSaveStreams: () => Promise<void>
  onAction: (action: 'read' | 'saved' | 'used') => void
  onCreate: () => void
  isDirty: boolean
  hasMissingFilters?: boolean
}) => {
  const { t } = useTranslation('wires')

  const handleAddStream = () => {
    void onAddStream()
  }

  const handleSaveStreams = () => {
    void onSaveStreams()
  }

  return (
    <div className='flex gap-2 ms-2'>
      <ButtonGroup className='p-0 rounded-md gap-1 border border-muted'>
        <Tooltip content={hasMissingFilters ? t('toolbar.saveRequiresFilter') : t('toolbar.save')}>
          <Button variant='ghost' disabled={!isDirty || hasMissingFilters} className='w-9 h-9 px-0' onClick={handleSaveStreams}>
            <SaveIcon strokeWidth={1.75} size={18} />
          </Button>
        </Tooltip>
        <Tooltip content={t('toolbar.addColumn')}>
          <Button variant='ghost' className='w-9 h-9 px-0' onClick={handleAddStream}>
            <Grid2X2PlusIcon strokeWidth={1.75} size={18} />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup className='p-0 rounded-md gap-1 border border-muted'>
        <Tooltip content={!disabled ? t('toolbar.markSaved') : t('toolbar.markSavedDisabled')}>
          <Button
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('saved')
            }}
            value='saved'
            aria-label={t('toolbar.markSaved')}
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-done-background'
            disabled={disabled}
          >
            <FolderDownIcon size={16} />
          </Button>
        </Tooltip>

        <Tooltip content={!disabled ? t('toolbar.markRead') : t('toolbar.markReadDisabled')}>
          <Button
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('read')
            }}
            value='read'
            aria-label={t('toolbar.markRead')}
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-approved-background'
            disabled={disabled}
          >
            <BookOpenCheckIcon size={16} />
          </Button>
        </Tooltip>

        <Tooltip content={!disabled ? t('toolbar.markUsed') : t('toolbar.markUsedDisabled')}>
          <Button
            size='sm'
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('used')
            }}
            value='used'
            aria-label={t('toolbar.markUsed')}
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-usable-background'
            disabled={disabled}
          >
            <CheckIcon size={16} />
          </Button>
        </Tooltip>

        <Tooltip content={!disabled ? t('toolbar.createArticle') : t('toolbar.createArticleDisabled')}>
          <Button
            size='sm'
            onMouseDown={(e) => {
              e.preventDefault()
              onCreate()
            }}
            aria-label={t('toolbar.createArticleAriaLabel')}
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-usable-background rounded-sm'
            disabled={disabled}
          >
            <PlusIcon size={16} fill='oklch(95.05% 0.022 263.19)' />
          </Button>
        </Tooltip>
      </ButtonGroup>
    </div>
  )
}
