import {
  Button,
  Dialog, DialogContent, DialogFooter, DialogTrigger
} from '@ttab/elephant-ui'

import { Planning } from '@/views/Planning'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'

export const CreatePlan = (): JSX.Element => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button variant='ghost' onClick={() => setOpen(!open)}>
          <PlusIcon size={18} strokeWidth={1.75} />
        </Button>
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        <Planning asChild className='p-0 rounded-md' />

        <DialogFooter className='p-4 border-t'>
          <Button onClick={() => {
            setOpen(!open)
          }}
          >
            Skapa planering
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
