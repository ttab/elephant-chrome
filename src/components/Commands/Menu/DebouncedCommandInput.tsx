import { type ForwardedRef, forwardRef, useRef, type InputHTMLAttributes, useState, useEffect } from 'react'
import { CommandInput } from '@ttab/elephant-ui'

const DebouncedCommandInput = forwardRef(({
  value: initialValue,
  onChange,
  debounce = 800,
  ...props
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
  debounce?: number
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>, ref: ForwardedRef<HTMLInputElement>): JSX.Element => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [value, setValue] = useState<string | undefined>(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleInputChange = (value: string | undefined): void => {
    setValue(value)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      onChange(value)
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

