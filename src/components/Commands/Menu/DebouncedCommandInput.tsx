import { type ForwardedRef, forwardRef, useRef, type InputHTMLAttributes } from 'react'
import { CommandInput } from '@ttab/elephant-ui'
import { useTable } from '@/hooks/useTable'

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
  const { table } = useTable()
  const { globalFilter } = table.getState() as {
    globalFilter: string
  }

  const handleInputChange = (value: string | undefined): void => {
    table.setGlobalFilter(value)

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
      value={globalFilter}
      onValueChange={(value: string | number) => handleInputChange(value as string)}
    />
  )
})

DebouncedCommandInput.displayName = 'DebouncedCommandInput'
export { DebouncedCommandInput }

