import { useState, useRef, useCallback } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { useYValue } from '@/hooks/useYValue'
import type * as Y from 'yjs'
import { SluglineButton } from './Slugline'
import { Validation } from '../Validation'

export const SluglineEditable = ({ path, documentStatus, onValidation }: {
  path: string
  documentStatus?: string
  onValidation?: (label: string, block: string, value: string | undefined, reason: string) => boolean
}): JSX.Element => {
  const [active, setActive] = useState(false)
  const setFocused = useRef<(value: boolean) => void>(null)
  const [slugLine] = useYValue<Y.XmlText | undefined>(path)
  const setAwareness = useCallback((active: boolean) => {
    if (setFocused?.current) {
      setFocused.current(active)
      setActive(active)
    }
  }, [setActive, setFocused])

  if (typeof slugLine === 'undefined') {
    return <></>
  }

  return (
    <Awareness name={`PlanSlugline-${path}`} ref={setFocused}>
      {documentStatus !== 'usable'
        ? <div className={!active ? 'relative h-6 mt-1.5 ring-1 ring-gray-300 rounded transition-colors hover:bg-gray-100 hover:cursor-pointer' : 'mt-0.5'}>
          <div className={!active ? 'absolute -top-1 w-full' : ''}>
            <TextBox
              path={path}
              placeholder='Lägg till slugg'
              singleLine={true}
              onBlur={() => {
                setAwareness(false)
              }}
              onFocus={() => {
                setAwareness(true)
              }}
              className='pl-2 h-6 font-normal text-sm whitespace-nowrap'
            />
          </div>
        </div>
        : <div>
          <SluglineButton path={path} setActive={setAwareness} />
        </div>
      }
      {onValidation &&
        <Validation
          label='Slugline'
          block='tt/slugline'
          path={path} onValidation={onValidation}
        />
      }
    </Awareness>
  )
}
