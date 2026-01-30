import { Button, ButtonGroup, Tooltip } from '@ttab/elephant-ui'
import { CheckIcon, FilePlus2Icon, FolderPlusIcon, PlusIcon, SaveIcon } from '@ttab/elephant-ui/icons'

export const WiresToolbar = ({ disabled = false, onAddStream, onAction }: {
  disabled?: boolean
  onAddStream: () => void
  onAction: (action: 'read' | 'saved' | 'used') => void
}) => {
  return (
    <div className='flex gap-2'>
      <ButtonGroup className='p-1 rounded-md gap-1'>
        <Button variant='ghost' className='w-9 h-9 px-0' onClick={onAddStream}>
          <PlusIcon strokeWidth={1.75} size={18} />
        </Button>
        <Button variant='ghost' disabled={true} className='w-9 h-9 px-0' onClick={() => {}}>
          <SaveIcon strokeWidth={1.75} size={18} />
        </Button>
      </ButtonGroup>

      <ButtonGroup className='p-1 rounded-md gap-1'>
        <Tooltip content='Markera som sparad'>
          <Button
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('saved')
            }}
            value='saved'
            aria-label='Markera som sparad'
            variant='ghost'
            className='w-9 h-9 px-0 hover:border bg-background hover:bg-done-background hover:border-done rounded-sm'
            disabled={disabled}
          >
            <FolderPlusIcon size={16} fill='oklch(98.51% 0.0264 99.9)' />
          </Button>
        </Tooltip>

        <Tooltip content='Markera som läst'>
          <Button
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('read')
            }}
            value='read'
            aria-label='Markera som läst'
            variant='ghost'
            className='w-9 h-9 px-0 hover:border bg-background hover:bg-approved-background hover:border-approved rounded-sm'
            disabled={disabled}
          >
            <CheckIcon size={16} fill='oklch(96.62% 0.0108 149.86)' />
          </Button>
        </Tooltip>

        <Tooltip content='Skapa artikel från telegram'>
          <Button
            size='sm'
            onMouseDown={(e) => {
              e.preventDefault()
              onAction('used')
            }}
            value='used'
            aria-label='Skapa artikel från telegram'
            variant='ghost'
            className='w-9 h-9 px-0 hover:border bg-background hover:bg-usable-background hover:border-usable rounded-sm'
            disabled={disabled}
          >
            <FilePlus2Icon size={16} fill='oklch(95.05% 0.022 263.19)' />
          </Button>
        </Tooltip>
      </ButtonGroup>
    </div>
  )
}
