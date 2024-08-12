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
  Square,
  SquareCheck
} from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { type DefaultValueOption } from '@/types'

interface ComboBoxProps extends React.PropsWithChildren {
  size?: string
  selectedOption?: DefaultValueOption | DefaultValueOption[]
  onOpenChange?: (isOpen: boolean) => void
  options: DefaultValueOption[]
  placeholder?: string
  onSelect: (option: DefaultValueOption) => void
  className?: string
  variant?: 'link' | 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | null | undefined
  hideInput?: boolean
  closeOnSelect?: boolean
}

export const ComboBox = ({
  size,
  variant,
  selectedOption,
  onOpenChange,
  options,
  placeholder,
  onSelect,
  className,
  children,
  hideInput,
  closeOnSelect = true
}: ComboBoxProps): JSX.Element => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleOpenChange = (isOpen: boolean): void => {
    onOpenChange && onOpenChange(isOpen)
    setOpen(isOpen)
  }

  const selectedOptions = !selectedOption
    ? []
    : !Array.isArray(selectedOption) ? [selectedOption] : selectedOption

  const label = selectedOptions.length > 1
    ? `${selectedOptions[0].label} +${selectedOptions.length - 1}`
    : selectedOptions.length ? selectedOptions[0].label : undefined

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            size={size || 'sm'}
            variant={variant || 'outline'}
            className={cn(
              'w-9 h-9 text-muted-foreground font-sans font-normal whitespace-nowrap p-0',
              className
            )
            }>
            {children || (label
              ? <>{label}</>
              : <>{placeholder || ''}</>)
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0' align='start'>
          <ComboBoxList
            options={options}
            selectedOptions={selectedOptions}
            setOpen={handleOpenChange}
            onSelect={(option) => {
              onSelect(option)
            }}
            label={label}
            hideInput={hideInput}
            closeOnSelect={closeOnSelect}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant='outline' className='w-[150px] justify-start px-2 whitespace-nowrap text-ellipsis'>
          {label ? <>{label}</> : <>{placeholder}</>}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className='mt-4 border-t'>
          <ComboBoxList
            options={options}
            selectedOptions={selectedOptions}
            setOpen={handleOpenChange}
            onSelect={onSelect}
            label={label}
            hideInput={hideInput}
            closeOnSelect={closeOnSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface ComboBoxListProps {
  options: DefaultValueOption[]
  selectedOptions: DefaultValueOption[]
  setOpen: (open: boolean) => void
  onSelect: (option: DefaultValueOption) => void
  label?: string
  hideInput?: boolean
  closeOnSelect: boolean
}

function ComboBoxList({
  options,
  selectedOptions,
  setOpen,
  onSelect,
  label,
  hideInput = false,
  closeOnSelect
}: ComboBoxListProps): JSX.Element {
  return (
    <Command>
      {!hideInput && <CommandInput placeholder={label || ''} />}
      <CommandList>
        <CommandEmpty>Ingenting hittades</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              className='group/checkbox'
              key={option.label}
              value={option.label}
              onSelect={(selectedLabel) => {
                const newSelectedOption = options.find((option) => option.label.toLocaleLowerCase() === selectedLabel)
                if (newSelectedOption) {
                  onSelect(newSelectedOption)
                }
                if (closeOnSelect) {
                  setOpen(false)
                }
              }}
            >
              <div className='flex space-x-2 items-center'>
                <div className="w-6">
                  {selectedOptions.find(o => o.value === option.value)
                    ? <SquareCheck size={18} strokeWidth={1.75} className="mr-4 group-hover/checkbox:opacity-50" />
                    : <Square size={18} strokeWidth={1.75} className="mr-4 opacity-0 group-hover/checkbox:opacity-50" />
                  }
                </div>

                {option?.icon && <option.icon {...option.iconProps} />}

                <div className="grow">
                  {option.label}
                </div>

                <CommandShortcut>{option.info || ''}</CommandShortcut>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
