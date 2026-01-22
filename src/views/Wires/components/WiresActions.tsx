import type { Wire } from '@/shared/schemas/wire'
import { Button, ButtonGroup, Tooltip } from '@ttab/elephant-ui'
import { CheckIcon, FilePlusIcon, FolderPlusIcon } from '@ttab/elephant-ui/icons'

export const WiresActions = ({ wires }: {
  wires: Array<Wire | null>
}) => {
  const actionableWires = wires.filter((wire) => {
    if (wire === null) {
      return false
    }

    // FIXME: If a wire has been used we should also filter it out (return false)

    return true
  })

  return (
    <ButtonGroup className='border border-muted rounded-md'>
      <Tooltip content='Markera som sparad'>
        <Button
          onKeyDown={(e) => e.preventDefault()}
          value='saved'
          aria-label='Markera som sparad'
          variant='ghost'
          className='w-9 h-9 px-0 hover:border hover:bg-done-background hover:border-done rounded-sm'
          disabled={!actionableWires.length}
        >
          <FolderPlusIcon
            strokeWidth={1.75}
            size={18}
          />
        </Button>
      </Tooltip>

      <Tooltip content='Markera som läst'>
        <Button
          onKeyDown={(e) => e.preventDefault()}
          value='saved'
          aria-label='Markera som läst'
          variant='ghost'
          className='w-9 h-9 px-0 hover:border hover:bg-approved-background hover:border-approved rounded-sm'
          disabled={!actionableWires.length}
        >
          <CheckIcon
            strokeWidth={1.75}
            size={18}
          />
        </Button>
      </Tooltip>

      <Tooltip content='Skapa artikel från telegram'>
        <Button
          size='sm'
          onKeyDown={(e) => e.preventDefault()}
          value='used'
          aria-label='Skapa artikel från telegram'
          variant='ghost'
          className='w-9 h-9 px-0 hover:border hover:bg-usable-background hover:border-usable rounded-sm'
          disabled={!actionableWires.length}
        >
          <FilePlusIcon
            strokeWidth={1.75}
            size={18}
          />
        </Button>
      </Tooltip>
    </ButtonGroup>
  )
}
