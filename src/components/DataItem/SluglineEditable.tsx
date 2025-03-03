import { useRef } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { useYValue } from '@/hooks/useYValue'
import type * as Y from 'yjs'
import { Validation } from '../Validation'
import { SluglineButton } from './Slugline'
import { type FormProps } from '../Form/Root'

export const SluglineEditable = ({ path, documentStatus, onValidation, validateStateRef }: {
  path: string
  documentStatus?: string
  onValidation?: (label: string, block: string, value: string | undefined, reason: string) => boolean
} & FormProps): JSX.Element => {
  const setFocused = useRef<(value: boolean) => void>(null)
  const [slugLine] = useYValue<Y.XmlText | undefined>(path)

  if (typeof slugLine === 'undefined') {
    return <></>
  }

  return (
    <div
      className='flex flex-col gap-2 items-center [&_[role="textbox"]:has([data-slate-placeholder="true"])]:min-w-28'
      data-ele-validation={!!onValidation}
    >
      {documentStatus !== 'usable'
        ? (
            <Awareness path={path} ref={setFocused}>
              <Validation
                label='Slugline'
                block='tt/slugline'
                path={path}
                onValidation={onValidation}
                validateStateRef={validateStateRef}
              >
                <TextBox
                  path={path}
                  placeholder='Lägg till slugg'
                  singleLine={true}
                  className='h-6 font-normal text-sm whitespace-nowrap mb-1'
                  spellcheck={false}
                />
              </Validation>
            </Awareness>
          )
        : <SluglineButton path={path} />}
    </div>
  )
}
