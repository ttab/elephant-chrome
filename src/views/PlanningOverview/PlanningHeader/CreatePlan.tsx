import {
  Button,
  Dialog, DialogContent, DialogTrigger
} from '@ttab/elephant-ui'
import type * as Y from 'yjs'

import { Planning } from '@/views/Planning'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { createPlanningDocument } from '@/lib/planning/createPlanningDocument'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { useRegistry } from '@/hooks/useRegistry'

export const CreatePlan = (): JSX.Element => {
  const [planning, setPlanning] = useState<[string | undefined, Y.Doc | undefined]>([undefined, undefined])
  const { locale, timeZone } = useRegistry()

  useKeydownGlobal(evt => {
    if (evt.key === 'Escape') {
      setPlanning([undefined, undefined])
    }
  })

  return (
    <Dialog open={!!planning[0]} >
      <DialogTrigger asChild>
        <Button size='sm' className='h-8 pr-4' onClick={() => {
          setPlanning(createPlanningDocument(locale, timeZone))
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
            asCreateDialog
            onDialogClose={(id) => {
              setPlanning([undefined, undefined])
              if (id) {
                // Open in new view
              }
            }}
          />
        }
      </DialogContent>
    </Dialog>
  )
}
