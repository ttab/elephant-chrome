import { type PropsWithChildren } from 'react'
import { useNavigation, useView } from '@/hooks'
import { ViewFocus } from './ViewFocus'
import { ViewDialogClose } from './ViewDialogClose'
import { handleClose } from '@/components/Link/lib/handleClose'

export const Action = ({ onDialogClose = undefined, children }: PropsWithChildren & {
  onDialogClose?: () => void
}): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const { viewId } = useView()

  const closer = onDialogClose || (() => handleClose({ viewId, dispatch }))

  return (
    <div className="flex flex-1 gap-2 items-center justify-end h-14">

      <div>
        {children}
      </div>

      {!onDialogClose && state.content.length > 1 &&
        <ViewFocus viewId={viewId} />
      }

      {(onDialogClose || state.content.length > 1) &&
        <ViewDialogClose onClick={closer} />
      }
    </div>
  )
}
