import { type ForwardedRef, forwardRef, useRef, useState, type InputHTMLAttributes, type JSX, useEffect } from 'react'
import { CommandInput } from '@ttab/elephant-ui'

const DebouncedCommandInput = forwardRef(({
  value: initialValue,
  onValueChange,
  debounce = 800,
  ...props
}: {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  debounce?: number
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>, ref: ForwardedRef<HTMLInputElement>): JSX.Element => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [value, setValue] = useState(initialValue ?? '')

  // Sync external state with internal state when initialValue changes
  useEffect(() => {
    setValue(initialValue ?? '')
  }, [initialValue])

  const handleInputChange = (value: string | undefined): void => {
    setValue(value ?? '')

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      onValueChange(value)
    }, debounce)
  }

  return (
    <CommandInput
      {...props}
      ref={ref}
      value={value}
      onValueChange={handleInputChange}
    />
  )
})

DebouncedCommandInput.displayName = 'DebouncedCommandInput'
export { DebouncedCommandInput }
