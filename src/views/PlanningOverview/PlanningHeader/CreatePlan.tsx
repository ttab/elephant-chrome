import {
  Button,
  Dialog, DialogContent, DialogFooter, DialogTrigger
} from '@ttab/elephant-ui'

import { Planning } from '@/views/Planning'
import { PlusIcon } from '@ttab/elephant-ui/icons'

export const CreatePlan = (): JSX.Element => {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='ghost'>
            <PlusIcon size={18} strokeWidth={1.75} />
          </Button>
        </DialogTrigger>

        <DialogContent className='p-0 rounded-md'>
          <Planning asChild className='p-0 rounded-md' />

          <DialogFooter className='p-3 border-t'>
            <Button variant=''>Skapa planering</Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
    </>
  )
}
