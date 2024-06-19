import {
  Button,
  Dialog, DialogContent, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'

export const CreateEvent = (): JSX.Element => {
  const [event, setEvent] = useState<[string | undefined, Y.Doc | undefined]>([undefined, undefined])

  useKeydownGlobal(evt => {
    if (evt.key === 'Escape') {
      setEvent([undefined, undefined])
    }
  })

  return (
    <Dialog open={!!event[0]} >
      <DialogTrigger asChild>
        <Button size='sm' className='h-8 pr-4' onClick={() => {
          alert('Skapa kalenderhändelse')
        }}>
          <PlusIcon size={18} strokeWidth={1.75} /> Ny
        </Button>
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        {event !== null &&
          <p>Skapa kalenderhändelse</p>
        }
      </DialogContent>
    </Dialog>
  )
}
