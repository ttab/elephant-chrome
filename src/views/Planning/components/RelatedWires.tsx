import { useState } from 'react'
import { Link } from '@/components/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Popover, PopoverContent, PopoverTrigger } from '@ttab/elephant-ui'
import { CableIcon } from '@ttab/elephant-ui/icons'

const WireList = ({ wires }: { wires: Block[] }) => (
  <div className='flex flex-col gap-0.5'>
    {wires.map((wire) => (
      <Link
        to='Wires'
        props={{ id: wire.uuid }}
        target='last'
        key={wire.uuid}
        className='text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-table-focused px-1.5 py-1 rounded-sm'
      >
        {wire.title}
      </Link>
    ))}
  </div>
)

export const RelatedWires = ({ wires = [], inline = false }: {
  wires: Block[] | undefined
  inline?: boolean
}) => {
  const [open, setOpen] = useState(false)

  if (!wires?.length) {
    return <></>
  }

  if (inline) {
    return (
      <div className='flex flex-col gap-0.5'>
        <WireList wires={wires} />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className='flex w-fit items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground cursor-default select-none'>
          <CableIcon size={13} strokeWidth={1.75} />
          <span>{wires.length === 1 ? 'Källtelegram' : `Källtelegram (${wires.length})`}</span>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className='w-auto max-w-80 p-2'
        side='bottom'
        align='start'
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <WireList wires={wires} />
      </PopoverContent>
    </Popover>
  )
}
