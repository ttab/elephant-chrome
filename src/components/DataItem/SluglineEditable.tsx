import { useMemo } from 'react'
import { TextBox } from '../ui'
import type * as Y from 'yjs'
import { Validation } from '../Validation'
import { SluglineButton } from './Slugline'
import { type FormProps } from '../Form/Root'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { useYPath, useYValue, type YDocument } from '@/modules/yjs/hooks'

export const SluglineEditable = ({ ydoc, rootMap, value, documentStatus, onValidation, validateStateRef, compareValues, disabled }: {
  ydoc: YDocument<Y.Map<unknown>>
  rootMap?: Y.Map<unknown>
  value?: Y.XmlText
  disabled?: boolean
  compareValues?: string[]
  documentStatus?: string
} & FormProps): JSX.Element => {
  const path = useYPath(value, true)
  const editable = documentStatus !== 'usable'
  const [slugLine] = useYValue<Y.XmlText | string>(ydoc.ele, path)
  const [assignments] = useYValue<Block[]>(ydoc.ele, ['meta', 'core/assignment'])

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

  if (!editable && typeof slugLine === 'undefined') {
    return <></>
  }

  return (
    <div
      className='flex flex-col gap-2 items-center [&_[role="textbox"]:has([data-slate-placeholder="true"])]:min-w-28'
      data-ele-validation={!!onValidation}
    >
      {editable
        ? (
            <Validation
              ydoc={ydoc}
              rootMap={rootMap}
              label='Slugline'
              block='tt/slugline'
              path={path}
              onValidation={onValidation}
              compareValues={slugLines}
              validateStateRef={validateStateRef}
            >
              <TextBox
                ydoc={ydoc}
                value={value}
                disabled={disabled}
                placeholder='Lägg till slugg'
                singleLine={true}
                className='h-6 font-normal text-sm whitespace-nowrap mb-1'
                spellcheck={false}
              />
            </Validation>
          )
        : (
            <SluglineButton value={slugLine as string} />
          )}
    </div>
  )
}
