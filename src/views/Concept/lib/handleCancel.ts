import type { SetStateAction } from 'react'

export const handleCancel = (
  isChanged: boolean | undefined,
  setShowVerifyDialog: (value: SetStateAction<boolean>) => void,
  onDialogClose: ((id?: string, title?: string) => void) | undefined): void => {
  if (isChanged) {
    setShowVerifyDialog(true)
  } else {
    if (onDialogClose) {
      onDialogClose()
    }
  }
}
