import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { CommandInput } from '@ttab/elephant-ui'

export const DebouncedCommandInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
  debounce?: number
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>): JSX.Element => {
  const [value, setValue] = useState<string | undefined>(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return (
    <CommandInput
      {...props}
      value={value}
      onValueChange={(value: string | number) => setValue(value as string)}
    />
  )
}

