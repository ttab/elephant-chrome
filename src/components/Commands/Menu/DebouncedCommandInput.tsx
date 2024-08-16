import { useRef, useState, type InputHTMLAttributes } from 'react'
import { CommandInput } from '@ttab/elephant-ui'

export const DebouncedCommandInput = ({
  value: initialValue,
  onChange,
  debounce = 800,
  ...props
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
  debounce?: number
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>): JSX.Element => {
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
      value={value}
      onValueChange={(value: string | number) => handleInputChange(value as string)}
    />
  )
}

