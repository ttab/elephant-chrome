import type { Wire } from '@/shared/schemas/wire'
import { Button, ButtonGroup, Tooltip } from '@ttab/elephant-ui'
import { CheckIcon, FilePlus2Icon, FolderPlusIcon, PlusIcon, SaveIcon } from '@ttab/elephant-ui/icons'

export const WiresToolbar = ({ wires, addWireStream }: {
  wires: Array<Wire | null>
  addWireStream: () => void
}) => {
  const actionableWires = wires.filter((wire) => {
    if (wire === null) {
      return false
    }

    // FIXME: If a wire has been used we should also filter it out (return false)

    return true
  })

  return (
    <div className='flex gap-2'>
      <ButtonGroup className='p-1 rounded-md gap-1'>
        <Button variant='ghost' className='w-9 h-9 px-0' onClick={addWireStream}>
          <PlusIcon strokeWidth={1.75} size={18} />
        </Button>
        <Button variant='ghost' disabled={true} className='w-9 h-9 px-0' onClick={() => {}}>
          <SaveIcon strokeWidth={1.75} size={18} />
        </Button>
      </ButtonGroup>

      <ButtonGroup className='p-1 rounded-md gap-1'>
        <Tooltip content='Markera som sparad'>
          <Button
            onKeyDown={(e) => e.preventDefault()}
            value='saved'
            aria-label='Markera som sparad'
            variant='ghost'
            className='w-9 h-9 px-0 hover:border bg-background hover:bg-done-background hover:border-done rounded-sm'
            disabled={!actionableWires.length}
          >
            <FolderPlusIcon size={16} fill='oklch(98.51% 0.0264 99.9)' />
          </Button>
        </Tooltip>

        <Tooltip content='Markera som läst'>
          <Button
            onKeyDown={(e) => e.preventDefault()}
            value='saved'
            aria-label='Markera som läst'
            variant='ghost'
            className='w-9 h-9 px-0 hover:border bg-background hover:bg-approved-background hover:border-approved rounded-sm'
            disabled={!actionableWires.length}
          >
            <CheckIcon size={16} fill='oklch(96.62% 0.0108 149.86)' />
          </Button>
        </Tooltip>

        <Tooltip content='Skapa artikel från telegram'>
          <Button
            size='sm'
            onKeyDown={(e) => e.preventDefault()}
            value='used'
            aria-label='Skapa artikel från telegram'
            variant='ghost'
            className='w-9 h-9 px-0 hover:border bg-background hover:bg-usable-background hover:border-usable rounded-sm'
            disabled={!actionableWires.length}
          >
            <FilePlus2Icon size={16} fill='oklch(95.05% 0.022 263.19)' />
          </Button>
        </Tooltip>
      </ButtonGroup>
    </div>
  )
}
