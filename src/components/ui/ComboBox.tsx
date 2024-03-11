import * as React from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  CommandShortcut
} from '@ttab/elephant-ui'
import {
  type LucideIcon,
  CheckIcon
} from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { type Block } from '@/protos/service'


interface ComboBoxOption {
  value: string
  label: string
  payload?: Partial<Block>
  icon?: LucideIcon
  info?: string
  color?: string
}

interface ComboBoxProps {
  size?: string
  selectedOption?: ComboBoxOption
  options: ComboBoxOption[]
  placeholder: string
  onSelect: (option: ComboBoxOption) => void
  className?: string
}

export const ComboBox = ({ size, selectedOption, options, placeholder, onSelect, className }: ComboBoxProps): JSX.Element => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size={size || 'sm'} variant='outline' className={cn('w-[150px]', className)}>
            {selectedOption?.color && <div className={cn('h-2 w-2 rounded-full mr-2', selectedOption?.color)} /> }
            {selectedOption ? <>{selectedOption.label}</> : <>{placeholder}</>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0' align='start'>
          <ComboBoxList
            options={options}
            selectedOption={selectedOption}
            setOpen={setOpen}
            onSelect={(option) => {
              onSelect(option)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant='outline' className='w-[150px] justify-start'>
          {selectedOption ? <>{selectedOption.label}</> : <>{placeholder}</>}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className='mt-4 border-t'>
          <ComboBoxList
            options={options}
            selectedOption={selectedOption}
            setOpen={setOpen}
            onSelect={onSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface ComboBoxListProps {
  options: ComboBoxOption[]
  selectedOption?: ComboBoxOption
  setOpen: (open: boolean) => void
  onSelect: (option: ComboBoxOption) => void
}
function ComboBoxList({ options, selectedOption, setOpen, onSelect }: ComboBoxListProps): JSX.Element {
  return (
    <Command>
      <CommandInput placeholder={selectedOption?.label || ''} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.label}
              value={option.label}
              onSelect={(selectedLabel) => {
                const newSelectedOption = options.find((option) => option.label.toLocaleLowerCase() === selectedLabel)
                if (newSelectedOption) {
                  onSelect(newSelectedOption)
                }
                setOpen(false)
              }}
            >
              {option.value === selectedOption?.value
                ? <CheckIcon className="mr-2 h-4 w-4" />
                : <span className="mr-2 h-4 w-4" />
              }
              <span>{option.label}</span>
              <CommandShortcut>{option.info || ''}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
