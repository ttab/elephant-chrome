import { Prompt } from '@/components/Prompt'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { useYValue } from '@/hooks/useYValue'
import { Button } from '@ttab/elephant-ui'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { XIcon } from '@ttab/elephant-ui/icons'
import { useState } from 'react'

export const ViewDialogClose = ({ onClick, Icon = XIcon, asDialog }: {
  Icon?: LucideIcon
  onClick: () => void
  asDialog?: boolean
}): JSX.Element => {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [isChanged] = useYValue<boolean>('root.changed')

  useNavigationKeys({
    stopPropagation: true,
    keys: ['Escape'],
    onNavigation: () => {
      if (asDialog) {
        if (isChanged) {
          setShowVerifyDialog(true)
        } else {
          onClick()
        }
      }
    }
  })

  return (
    <>
      <Button
        variant='ghost'
        className='w-9 h-9 p-0 hover:bg-gray-200 dark:hover:bg-gray-100'
        onClick={() => {
          if (isChanged) {
            setShowVerifyDialog(true)
          } else {
            onClick()
          }
        }}
      >
        <Icon size={18} strokeWidth={1.75} />
      </Button>
      {showVerifyDialog && (
        <Prompt
          title='Du har osparade ändringar'
          description='Är du säker på att du vill stänga utan att spara?'
          onPrimary={onClick}
          primaryLabel='Ja'
          onSecondary={() => setShowVerifyDialog(false)}
          secondaryLabel='Nej'
        />
      )}
    </>
  )
}
