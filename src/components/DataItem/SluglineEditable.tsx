import { useRef } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { useYValue } from '@/hooks/useYValue'
import type * as Y from 'yjs'
import { Validation } from '../Validation'
import { SluglineButton } from './Slugline'

export const SluglineEditable = ({ path, documentStatus, onValidation }: {
  path: string
  documentStatus?: string
  onValidation?: (label: string, block: string, value: string | undefined, reason: string) => boolean
}): JSX.Element => {
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
            <Awareness name={`PlanSlugline-${path}`} ref={setFocused}>
              <Validation
                label='Slugline'
                block='tt/slugline'
                path={path}
                onValidation={onValidation}
              >
                <TextBox
                  path={path}
                  placeholder='Lägg till slugg'
                  singleLine={true}
                  className='h-6 font-normal text-sm whitespace-nowrap mb-1'
                />
              </Validation>
            </Awareness>
          )
        : <SluglineButton path={path} />}
    </div>
  )
}
