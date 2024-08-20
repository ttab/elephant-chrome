import { type ForwardedRef, forwardRef, useRef, useState, type InputHTMLAttributes } from 'react'
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
  const [value, setValue] = useState<string | undefined>(initialValue)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

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
      onValueChange={(value: string | number) => handleInputChange(value as string)}
    />
  )
})

DebouncedCommandInput.displayName = 'DebouncedCommandInput'
export { DebouncedCommandInput }

