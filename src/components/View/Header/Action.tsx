import { type PropsWithChildren } from 'react'
import { useNavigation, useView } from '@/hooks'
import { ViewFocus } from './ViewFocus'
import { ViewDialogClose } from './ViewDialogClose'

export const Action = ({ onDialogClose = undefined, children }: PropsWithChildren & {
  onDialogClose?: () => void
}): JSX.Element => {
  const { state } = useNavigation()
  const { viewId } = useView()

  return (
    <div className="flex flex-1 gap-2 items-center justify-end h-14">

      <div>
        {children}
      </div>

      {!onDialogClose && state.content.length > 1 &&
        <ViewFocus viewId={viewId} />
      }

      {!!onDialogClose &&
        <ViewDialogClose onClick={onDialogClose} />
      }
    </div>
  )
}
