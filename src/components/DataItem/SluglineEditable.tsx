import { useMemo, useRef } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { useYValue } from '@/hooks/useYValue'
import type * as Y from 'yjs'
import { Validation } from '../Validation'
import { SluglineButton } from './Slugline'
import { type FormProps } from '../Form/Root'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'

export const SluglineEditable = ({ path, documentStatus, onValidation, validateStateRef, compareValues, disabled, onChange }: {
  disabled?: boolean
  path: string
  compareValues?: string[]
  documentStatus?: string
  onChange?: (value: TBElement[]) => void
} & FormProps): JSX.Element => {
  const setFocused = useRef<(value: boolean) => void>(null)
  const [slugLine] = useYValue<Y.XmlText>(path)
  const [assignments] = useYValue<Block[]>('meta.core/assignment')

  // Get all current sluglines from assignments for validation purposes
  // or use provided compareValues
  const slugLines = useMemo(() => {
    if (compareValues?.length) {
      return compareValues
    }

    return (assignments || []).reduce<string[]>((acc, item) => {
      const slugline = (item.meta as unknown as Record<string, Block[]>)?.['tt/slugline']?.[0]?.value
      return (slugline) ? [...acc, slugline] : acc
    }, [])
  }, [assignments, compareValues])

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
                compareValues={slugLines}
                validateStateRef={validateStateRef}
              >
                <TextBox
                  disabled={disabled}
                  path={path}
                  placeholder='Lägg till slugg'
                  singleLine={true}
                  className='h-6 font-normal text-sm whitespace-nowrap mb-1'
                  spellcheck={false}
                  onChange={onChange}
                />
              </Validation>
            </Awareness>
          )
        : <SluglineButton path={path} />}
    </div>
  )
}
