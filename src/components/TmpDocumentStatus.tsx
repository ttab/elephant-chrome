import { Button, ComboBox } from '@ttab/elephant-ui'
import { DocumentStatuses } from '@/defaults'
import { type Status } from '@/hooks/useDocumentStatus'
import { cva } from 'class-variance-authority'
import { ChevronDown, Loader } from '@ttab/elephant-ui/icons'
import type { PropsWithChildren } from 'react'
import { useRef } from 'react'
import { Awareness } from './Awareness'
import { cn } from '@ttab/elephant-ui/utils'

const variants = cva('rounded-md h-6 font-thin', {
  variants: {
    status: {
      draft: 'border-s-[6px]',
      done: 'hover:bg-done-border bg-done-background border-done-border border-s-done',
      approved: 'hover:bg-approved-border bg-approved-background border-approved-border border-s-approved',
      withheld: 'hover:bg-withheld-border bg-withheld-background border-withheld-border border-s-withheld',
      usable: 'hover:bg-usable-border bg-usable-background border-usable-border border-s-usable'
    },
    defaultVariants: {
      status: undefined // No default style for status
    }
  }
})

export const DocumentStatus = ({ status, setStatus }: {
  status?: Status
  setStatus: (newStatusName: string) => Promise<void>
}): JSX.Element => {
  const selectedOptions = DocumentStatuses.filter((type) => type.value === (status?.name || 'draft'))

  if (status === undefined) {
    return <Loader size={14} strokeWidth={1.75} className='animate-spin' />
  }

  return (
    <div
      className={cn(variants({
        status: nextStatus(status?.name).status
      }), 'border-s-[6px]')}
    >
      <div className='flex'>
        <DropdownStatus setStatus={setStatus} status={status}>
          <ChevronDown size={14} strokeWidth={1.75} />
        </DropdownStatus>
        <Button
          variant='ghost'
          disabled={status?.name === 'usable'}
          className={cn(variants({
            status: nextStatus(status?.name).status
          }), 'pl-0')}
          onClick={() => {
            void setStatus(nextStatus(status?.name).status)
          }}
        >
          {nextStatus(selectedOptions[0].value).label}
        </Button>
      </div>
    </div>
  )
}

function nextStatus(currentStatus: string | undefined): {
  status: 'draft' | 'done' | 'approved' | 'usable'
  label: string
} {
  switch (currentStatus) {
    case undefined:
    case 'draft': {
      return {
        status: 'done',
        label: 'Klarmarkera'
      }
    }
    case 'done': {
      return {
        status: 'approved',
        label: 'Godkänn'
      }
    }
    case 'approved': {
      return {
        status: 'usable',
        label: 'Publicera'
      }
    }
    case 'usable': {
      return {
        status: 'usable',
        label: 'Publicerad'
      }
    }

    case 'withheld': {
      return {
        status: 'usable',
        label: 'Publicera'
      }
    }
  }

  throw new Error(`Unknown status: ${currentStatus}`)
}


const DropdownStatus = ({ status, setStatus, children }: {
  status?: Status
  setStatus: (newStatusName: string) => Promise<void>
} & PropsWithChildren): JSX.Element => {
  const setFocused = useRef<(value: boolean) => void>(null)
  // TODO: Handle withheld and cancelled statuses
  // Ignore these statuses for now, we're not able to set these statuses yet
  const ignore = ['withheld', 'cancelled']
  const selectedOptions = DocumentStatuses.filter((type) => type.value === (status?.name || 'draft'))
  const options = DocumentStatuses.filter((type) => !ignore.includes(type.value))

  return (
    <Awareness name='DocumentStatus' ref={setFocused}>
      <ComboBox
        max={1}
        className={cn(variants({
          status: nextStatus(status?.name).status
        }), 'p-1 size-6')}
        size='sm'
        options={options}
        variant='ghost'
        selectedOptions={selectedOptions}
        onSelect={(option) => {
          if (status?.version !== undefined) {
            void setStatus(option.value)
          }
        }}
      >
        {children}
      </ComboBox>
    </Awareness>
  )
}
