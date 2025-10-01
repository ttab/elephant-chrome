import React, { useCallback, useRef } from 'react'
import { Awareness } from '../Awareness'
import { TextboxRoot } from './Textbox/TextboxRoot'
import { useYPath, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { Descendant } from 'slate'
import { cn } from '@ttab/elephant-ui/utils'

export const TextBox = ({ icon: Icon, value, onChange, ...props }: {
  ydoc: YDocument<Y.Map<unknown>>
  value: Y.XmlText | undefined
  disabled?: boolean
  icon?: React.ReactNode
  placeholder?: string
  className?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onChange?: (arg: Descendant[]) => void
}): JSX.Element => {
  const path = useYPath(value, true)
  const setFocused = useRef<(value: boolean, key: string) => void>(() => { })
  const { onFocus, onBlur } = props

  const handleOnFocus = useCallback<React.FocusEventHandler<HTMLDivElement>>((e) => {
    setFocused.current(true, path)
    if (onFocus) {
      onFocus(e)
    }
  }, [onFocus, path])

  const handleOnBlur = useCallback<React.FocusEventHandler<HTMLDivElement>>((e) => {
    setFocused.current(true, '')
    if (onBlur) {
      onBlur(e)
    }
  }, [onBlur])

  return (
    <Awareness ydoc={props.ydoc} path={path} ref={setFocused} className='w-full'>
      <div className='w-full flex flex-row gap-2'>
        {Icon && (
          <div className='pt-1.5'>
            {Icon}
          </div>
        )}

        {value
          ? (
              <TextboxRoot {...props} value={value} onBlur={handleOnBlur} onFocus={handleOnFocus} />
            )
          : (
              <div className={cn(!props.singleLine && 'h-20!',
                `w-full
                p-1
                py-1.5
                ps-2
                h-8
                rounded-md
                outline-none
                ring-offset-background
                ring-1
                ring-input
                dark:ring-gray-600
                whitespace-nowrap
                bg-gray-50
                dark:bg-input`
              )}
              />
            )}
      </div>
    </Awareness>
  )
}
