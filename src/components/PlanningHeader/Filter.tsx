import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'
import { ChevronDown } from '@ttab/elephant-ui/icons'

export const Filter = (): JSX.Element => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant='outline'
        size='sm'
        className='ml-4 h-8'
      >
        <span className='text-sm'>Filter</span>
        <ChevronDown className='w-4 h-4 ml-1' />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className='w-56' align='start'>
      Filter
    </DropdownMenuContent>
  </DropdownMenu>
)

