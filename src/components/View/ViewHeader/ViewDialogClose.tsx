import { Prompt } from '@/components/Prompt'
import { WorkflowSpecifications } from '@/defaults/workflowSpecification'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { type YDocument } from '@/modules/yjs/hooks'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { Button } from '@ttab/elephant-ui'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { XIcon } from '@ttab/elephant-ui/icons'
import { useState, type JSX } from 'react'
import type * as Y from 'yjs'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'

export const ViewDialogClose = ({ ydoc, onClick, Icon = XIcon, asDialog }: {
  ydoc?: YDocument<Y.Map<unknown>>
  Icon?: LucideIcon
  onClick: () => void
  asDialog?: boolean
}): JSX.Element => {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [documentStatus] = useWorkflowStatus({ documentId: ydoc?.id })

  const asSave = (documentStatus?.type
    ? WorkflowSpecifications[documentStatus.type][documentStatus.name].asSave && ydoc?.isChanged
    : false) || false

  const handleClose = () => {
    if (asSave) {
      setShowVerifyDialog(true)
    } else {
      onClick()
    }
  }

  useNavigationKeys({
    stopPropagation: true,
    keys: ['Escape'],
    onNavigation: () => {
      if (asDialog) {
        handleClose()
      } else {
        setShowVerifyDialog(false)
      }
    }
  })

  return (
    <>
      <Button
        variant='ghost'
        onClick={handleClose}
        className='w-9 h-9 p-0 hover:bg-gray-200 dark:hover:bg-table-focused'
      >
        <Icon size={18} strokeWidth={1.75} />
      </Button>
      {showVerifyDialog && (
        <Prompt
          title='Vill du publicera ändringarna innan du stänger?'
          description='Dina ändringar är sparade men inte publicerade.'
          onPrimary={() => {
            if (ydoc) {
              snapshotDocument(ydoc?.id, {
                status: 'usable'
              }, ydoc.provider?.document)
                .then(() => {
                  setShowVerifyDialog(false)
                  onClick()
                })
                .catch((error) => {
                  setShowVerifyDialog(false)
                  toast.error('Kunde inte spara dokumentet')
                  console.error('Could not snapshot document before closing view.', error)
                })
            }
          }}
          primaryLabel='Ja'
          onSecondary={() => {
            setShowVerifyDialog(false)
            onClick()
          }}
          secondaryLabel='Nej'
          onCancel={() => setShowVerifyDialog(false)}
          cancelLabel='Avbryt'
        />
      )}
    </>
  )
}
