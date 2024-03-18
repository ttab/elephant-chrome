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
  CheckIcon
} from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { type DefaultValueOption } from '@/types'

interface ComboBoxProps extends React.PropsWithChildren {
  size?: string
  selectedOption?: DefaultValueOption
  options: DefaultValueOption[]
  placeholder?: string
  onSelect: (option: DefaultValueOption) => void
  className?: string
  variant?: 'link' | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | null | undefined
  hideInput?: boolean
}

export const ComboBox = ({
  size,
  variant,
  selectedOption,
  options,
  placeholder,
  onSelect,
  className,
  children,
  hideInput
}: ComboBoxProps): JSX.Element => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size={size || 'sm'}
            variant={ variant || 'outline'}
            className={cn(
              'w-[150px] text-muted-foreground font-sans font-normal whitespace-nowrap',
              className
            )
          }>
            {children || (selectedOption
              ? <>{selectedOption?.label}</>
              : <>{placeholder || ''}</>)
            }
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
            hideInput={hideInput}
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
            hideInput={hideInput}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface ComboBoxListProps {
  options: DefaultValueOption[]
  selectedOption?: DefaultValueOption
  setOpen: (open: boolean) => void
  onSelect: (option: DefaultValueOption) => void
  hideInput?: boolean
}

function ComboBoxList({
  options,
  selectedOption,
  setOpen,
  onSelect,
  hideInput = false
}: ComboBoxListProps): JSX.Element {
  return (
    <Command>
      {!hideInput && <CommandInput placeholder={selectedOption?.label || ''} />}
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
              <div className='flex space-x-2 items-center'>
                {option.value === selectedOption?.value
                  ? <CheckIcon size={18} strokeWidth={1.75} className="mr-2" />
                  : <span className="mr-2 h-4 w-4" />
              }
                {option?.icon && <option.icon {...option.iconProps} />}
                <span>{option.label}</span>
                <CommandShortcut>{option.info || ''}</CommandShortcut>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
