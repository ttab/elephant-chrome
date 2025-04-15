import React, { useCallback, useRef } from 'react'
import { Awareness } from '../Awareness'
import { TextboxRoot } from './Textbox/TextboxRoot'

export const TextBox = ({ icon: Icon, path, ...props }: {
  disabled?: boolean
  path: string
  icon?: React.ReactNode
  placeholder?: string
  className?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
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
    <Awareness path={path} ref={setFocused} className='w-full'>
      <div className='w-full flex flex-row gap-2'>
        {Icon && (
          <div className='pt-1.5'>
            {Icon}
          </div>
        )}

        <TextboxRoot {...props} path={path} onBlur={handleOnBlur} onFocus={handleOnFocus} />
      </div>
    </Awareness>
  )
}

