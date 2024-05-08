import {
  Button,
  Dialog, DialogContent, DialogFooter, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import { Planning } from '@/views/Planning'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { createPlanningDocument } from '@/lib/planning/createPlanningDocument'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'

export const CreatePlan = (): JSX.Element => {
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
          setPlanning(createPlanningDocument())
        }}>
          <PlusIcon size={18} strokeWidth={1.75} /> Ny
        </Button>
      </DialogTrigger>

      <DialogContent className='p-0 rounded-md'>
        {planning !== null &&
          <Planning
            id={planning[0]}
            document={planning[1]}
            className='p-0 rounded-md'
            asDialog
            onDialogClose={(id) => {
              setPlanning([undefined, undefined])
              if (id) {
                // Open in new view
              }
            }}
          />
        }

        <DialogFooter className='p-4 border-t'>
          <Button onClick={() => {
            // Get the id, post it, and open it in a view?
            setPlanning([undefined, undefined])
          }}>
            Skapa planering
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
