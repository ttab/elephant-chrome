import { Button, ButtonGroup, Tooltip } from '@ttab/elephant-ui'
import { CheckIcon, EyeIcon, FolderIcon, Grid2X2PlusIcon, PlusIcon, SaveIcon } from '@ttab/elephant-ui/icons'

export const WiresToolbar = ({ disabled = false, onAddStream, onSaveStreams, onAction, isDirty }: {
  disabled?: boolean
  onAddStream: () => void
  onSaveStreams: () => Promise<void>
  onAction: (action: 'read' | 'saved' | 'used') => void
  isDirty: boolean
}) => {
  const handleAddStream = () => {
    void onAddStream()
  }

  const handleSaveStreams = () => {
    void onSaveStreams()
  }

  return (
    <div className='flex gap-2 ms-2'>
      <ButtonGroup className='p-0 rounded-md gap-1 border border-muted'>
        <Tooltip content='Spara inställningar för vyn'>
          <Button variant='ghost' disabled={!isDirty} className='w-9 h-9 px-0' onClick={handleSaveStreams}>
            <SaveIcon strokeWidth={1.75} size={18} />
          </Button>
        </Tooltip>
        <Tooltip content='Lägg till kolumn'>
          <Button variant='ghost' className='w-9 h-9 px-0' onClick={handleAddStream}>
            <Grid2X2PlusIcon strokeWidth={1.75} size={18} />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup className='p-0 rounded-md gap-1 border border-muted'>
        <Tooltip content={!disabled ? 'Markera som sparad' : 'Välj telegram för att markera som sparad'}>
          <Button
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('saved')
            }}
            value='saved'
            aria-label='Markera som sparad'
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-done-background'
            disabled={disabled}
          >
            <FolderIcon size={16} fill='oklch(98.51% 0.0264 99.9)' />
          </Button>
        </Tooltip>

        <Tooltip content={!disabled ? 'Markera som läst' : 'Välj telegram för att markera som läst'}>
          <Button
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('read')
            }}
            value='read'
            aria-label='Markera som läst'
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-approved-background'
            disabled={disabled}
          >
            <EyeIcon size={16} fill='oklch(96.62% 0.0108 149.86)' />
          </Button>
        </Tooltip>

        <Tooltip content={!disabled ? 'Markera som använd' : 'Välj telegram för att markera som använd'}>
          <Button
            size='sm'
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('used')
            }}
            value='used'
            aria-label='Markera som använd'
            variant='ghost'
            className='w-9 h-9 px-0 hover:bg-usable-background'
            disabled={disabled}
          >
            <CheckIcon size={16} fill='oklch(95.05% 0.022 263.19)' />
          </Button>
        </Tooltip>

        <Tooltip content={!disabled ? 'Skapa artikel med tillhörande planering från telegram' : 'Välj telegram för att skapa artikel med tillhörande planering'}>
          <Button
            size='sm'
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('used')
            }}
            value='used'
            aria-label='Skapa artikel från telegram'
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
