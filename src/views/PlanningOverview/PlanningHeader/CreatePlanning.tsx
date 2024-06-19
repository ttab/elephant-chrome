import {
  Button,
  Dialog, DialogContent, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'

export const CreatePlanning = (): JSX.Element => {
  const [planning, setPlanning] = useState<[string | undefined, Y.Doc | undefined]>([undefined, undefined])

  useKeydownGlobal(evt => {
    if (evt.key === 'Escape') {
      setPlanning([undefined, undefined])
    }
  })

  return (
    <Dialog open={!!planning[0]} >
      <DialogTrigger asChild>
        <Button size='sm' className='h-8 pr-4' onClick={() => {
          alert('Skapa planering')
        }}>
          <PlusIcon size={18} strokeWidth={1.75} /> Ny
        </Button>
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        {planning !== null &&
          <p>Skapa planering</p>
        }
      </DialogContent>
    </Dialog>
  )
}
