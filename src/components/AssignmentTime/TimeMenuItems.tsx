import React, { useState, type PropsWithChildren, useRef, useEffect } from 'react'
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

import { CalendarFoldIcon, CalendarClockIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '@/types/index'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}
export const timeSlotTypes: DefaultValueOption[] = [
  {
    label: 'Heldag',
    value: 'fullDay',
    icon: CalendarFoldIcon,
    iconProps
  },
  {
    label: 'Morgon',
    value: 'morning',
    icon: Clock5Icon,
    iconProps
  },
  {
    label: 'Förmiddag',
    value: 'forenoon',
    icon: Clock10Icon,
    iconProps
  },
  {
    label: 'Eftermiddag',
    value: 'afternoon',
    icon: Clock2Icon,
    iconProps
  },
  {
    label: 'Kväll',
    value: 'evening',
    icon: Clock6Icon,
    iconProps
  }
]

export const TimeMenuItems = () => {

  return (
    {timeSlotTypes.map((slot) => {
        <CommandItem
        key={'Heldag'}
        value={'Heldag'}
        onSelect={() => {
          console.log('XXX Full day')
        }}
      >
        <div className='flex flex-row space-x-2 items-center'>
          <CalendarFoldIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
          <div>Heldag</div>
        </div>
      </CommandItem>
      }

  )
}


    // [
    //   <CommandItem
    //     key={'Heldag'}
    //     value={'Heldag'}
    //     onSelect={() => {
    //       console.log('XXX Full day')
    //     }}
    //   >
    //     <div className='flex flex-row space-x-2 items-center'>
    //       <CalendarFoldIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
    //       <div>Heldag</div>
    //     </div>
    //   </CommandItem>,
    //    <CommandItem
    //    key={'Morgon'}
    //    value={'Morgon'}
    //    onSelect={() => {
    //      console.log('XXX morning')
    //    }}
    //  >
    //    <div className='flex flex-row space-x-2 items-center'>
    //      <Clock10Icon size={18} strokeWidth={1.75} className='text-muted-foreground' />
    //      <div className="grow">
    //        Morgon
    //      </div>
    //    </div>
    //  </CommandItem>,
    //   <CommandItem
    //     key={'Förmiddag'}
    //     value={'Förmiddag'}
    //     onSelect={() => {
    //       console.log('XXX forenon')
    //     }}
    //   >
    //     <div className='flex flex-row space-x-2 items-center'>
    //       <Clock10Icon size={18} strokeWidth={1.75} className='text-muted-foreground' />
    //       <div className="grow">
    //         Förmiddag
    //       </div>
    //     </div>
    //   </CommandItem>,
    //   <CommandItem
    //     key={'Eftermiddag'}
    //     value={'Eftermiddag'}
    //     onSelect={() => {
    //       console.log('XXX afternoon')
    //     }}
    //   >
    //     <div className='flex flex-row space-x-2 items-center'>
    //       <div><Clock10Icon size={18} strokeWidth={1.75} className='text-muted-foreground' /></div>
    //       <div className="grow">
    //         Eftermiddag
    //       </div>
    //     </div>
    //   </CommandItem>,
    //   <CommandItem
    //     key={'Kväll'}
    //     value={'Kväll'}
    //     onSelect={() => {
    //       console.log('XXX evening')
    //     }}
    //   >
    //     <div className='flex flex-row space-x-2 items-center'>
    //       <Clock10Icon size={18} strokeWidth={1.75} className='text-muted-foreground' />
    //       <div className="grow">
    //         Kväll
    //       </div>
    //     </div>
    //   </CommandItem>
    // ]
  // )

// }