import React, { useCallback, useRef } from 'react'
import { Awareness } from '../Awareness'
import { TextboxRoot } from './Textbox/TextboxRoot'
import { useCollaboration } from '@/hooks/useCollaboration'
import { getValueByYPath } from '@/lib/yUtils'

export const TextBox = ({ icon: Icon, path, ...props }: {
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
  const { provider } = useCollaboration()
  const setFocused = useRef<(value: boolean, key: string) => void>(null)
  const { onFocus, onBlur } = props
  const [uuid] = getValueByYPath(provider?.document.getMap('ele'), 'root.uuid')

  const handleOnFocus = useCallback<React.FocusEventHandler<HTMLDivElement>>((e) => {
    if (setFocused.current) {
      setFocused.current(true, path)
    }
    if (onFocus) {
      onFocus(e)
    }
  }, [onFocus, path])

  const handleOnBlur = useCallback<React.FocusEventHandler<HTMLDivElement>>((e) => {
    if (setFocused.current) {
      setFocused.current(true, path)
    }
    if (onBlur) {
      onBlur(e)
    }
  }, [onBlur, path])

  return (
    <Awareness name={uuid as string} path={path} ref={setFocused} className='w-full'>
      <div className='w-full flex flex-row gap-2'>
        <div className='pt-1.5'>
          {Icon}
        </div>

        <TextboxRoot {...props} path={path} onBlur={handleOnBlur} onFocus={handleOnFocus} />
      </div>
    </Awareness>
  )
}

