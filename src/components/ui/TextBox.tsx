import React, { useCallback, useRef } from 'react'
import { Awareness } from '../Awareness'
import { TextboxRoot } from './Textbox/TextboxRoot'
import { Label } from '@ttab/elephant-ui'

export const TextBox = ({ id, label, asDialog, icon: Icon, iconAction, path, onChange, className, ...props }: {
  id?: string
  label?: string
  asDialog?: boolean | undefined
  disabled?: boolean
  path: string
  icon?: React.ReactNode
  iconAction?: () => void
  placeholder?: string
  className?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onChange?: (arg: boolean) => void
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
      {label && <Label htmlFor={id}>{label}</Label>}
      <div id={id} className='w-full flex flex-row gap-2'>
        {Icon && (
          <div className='pt-1.5' onClick={iconAction}>
            {Icon}
          </div>
        )}
        <TextboxRoot className={className} {...props} path={path} onBlur={handleOnBlur} onFocus={handleOnFocus} onChange={onChange} />
      </div>
    </Awareness>
  )
}

