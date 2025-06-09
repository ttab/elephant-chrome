import { type ChangeEvent } from 'react'
import { type Editor } from 'slate'

export const actionHandler = ({ editor, api }: { editor: Editor, api?: unknown }): boolean => {
  let fileSelector: HTMLInputElement | undefined = document.createElement('input')

  fileSelector.accept = 'image/jpg, image/gif, image/png'
  fileSelector.setAttribute('type', 'file')
  fileSelector.setAttribute('multiple', 'multiple')

  fileSelector.addEventListener('change', (e: unknown) => {
    const event: ChangeEvent<HTMLInputElement> = e as ChangeEvent<HTMLInputElement>

    if (event.target.files?.length) {
      // @ts-expect-error Needs fixing in Textbit
      api.consumeFileInputChangeEvent(editor, event)
    }

    setTimeout(() => {
      fileSelector = undefined
    }, 0)
  })

  fileSelector.click()

  return true
}
