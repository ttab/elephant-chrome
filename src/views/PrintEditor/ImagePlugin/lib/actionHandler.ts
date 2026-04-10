import { type ChangeEvent } from 'react'
import type { TBActionHandler } from '@ttab/textbit'

export const actionHandler: TBActionHandler = ({ editor, api }) => {
  let fileSelector: HTMLInputElement | undefined = document.createElement('input')

  fileSelector.accept = 'image/jpg, image/jpeg, image/gif, image/png'
  fileSelector.setAttribute('type', 'file')
  fileSelector.setAttribute('multiple', 'multiple')

  fileSelector.addEventListener('change', (e: unknown) => {
    const event: ChangeEvent<HTMLInputElement> = e as ChangeEvent<HTMLInputElement>

    if (event?.target?.files?.length) {
      api?.consumeFileInputChangeEvent(editor, event)
    }

    setTimeout(() => {
      fileSelector = undefined
    }, 0)
  })

  fileSelector.click()

  return true
}
