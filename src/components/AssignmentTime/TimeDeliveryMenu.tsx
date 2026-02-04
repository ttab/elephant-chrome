import React, { useState, type JSX } from 'react'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'
import { TimeSlotItems } from './TimeSlotItems'
import { TimeSelectItem } from './TimeSelectItem'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

interface TimeMenuProps extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string
  assignment: Y.Map<unknown>
  assignmentType?: string
}

/**
 *
 * Used for displaying and setting times in text, flash, editorial-info assignment types
 */
export const TimeDeliveryMenu = ({
  children,
  handleOnSelect,
  assignment,
  assignmentType
}: TimeMenuProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const handleOpenChange = (isOpen: boolean): void => {
    setOpen(isOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant='ghost'
          className='h-9 font-sans font-normal whitespace-nowrap p-0'
          onKeyDown={(event) => {
            if (event.key !== 'Escape') {
              event?.stopPropagation()
            }
          }}
        >
          {children}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='p-0'
        align='start'
        onEscapeKeyDown={(event) => event?.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder='' />
          <CommandList>
            <CommandEmpty>{t('common:errors.nothingFound')}</CommandEmpty>
            <div className='flex flex-col divide-y'>
              <CommandGroup>
                <TimeSlotItems handleOnSelect={handleOnSelect} handleParentOpenChange={handleOpenChange} assignmentType={assignmentType} t={t} />
              </CommandGroup>
              {assignmentType !== 'text' && (
                <CommandGroup>
                  <TimeSelectItem handleOnSelect={handleOnSelect} assignment={assignment} handleParentOpenChange={handleOpenChange} />
                </CommandGroup>
              )}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
