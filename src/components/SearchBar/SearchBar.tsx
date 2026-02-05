import { useState, useCallback, type JSX } from 'react'
import { Command, CommandInput } from '@ttab/elephant-ui'
import { useQuery } from '@/hooks/useQuery'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import { DebouncedCommandInput } from '../Commands/Menu/DebouncedCommandInput'

interface SearchBarProps {
  placeholder?: string
  searchType?: SearchKeys
  className?: string
  inputClassName?: string
  value?: string
  onChange?: (value: string) => void
}

/**
 * SearchBar component supporting both controlled and uncontrolled modes.
 * - Controlled: Pass `value` and `onChange` props - used for tables
 * - Uncontrolled: Manages internal state and updates URL query params -  used for SearchOverview
 */
export const SearchBar = ({
  placeholder = 'Sök',
  searchType,
  className,
  inputClassName,
  value,
  onChange
}: SearchBarProps): JSX.Element => {
  const [query, setQueryString] = useQuery()
  const [localValue, setLocalValue] = useState<string | undefined>()
  const isControlled = value !== undefined && onChange !== undefined

  const SearchBarInput = isControlled ? DebouncedCommandInput : CommandInput

  const getInputValue = useCallback((): string => {
    if (isControlled) return value ?? ''
    if (localValue !== undefined) return localValue
    return typeof query?.query === 'string' ? query.query : ''
  }, [isControlled, value, localValue, query])

  const handleSubmit = useCallback((submitValue?: string): void => {
    if (!isControlled) {
      setQueryString({ type: searchType, query: getInputValue(), page: undefined })
    }
    onChange?.(submitValue ?? '')
  }, [isControlled, searchType, setQueryString, onChange, getInputValue])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      const submitValue = isControlled ? (value ?? '') : localValue
      handleSubmit(submitValue)
    }
  }, [isControlled, value, localValue, handleSubmit])

  const handleInputChange = useCallback((newValue: string | undefined): void => {
    if (isControlled) {
      handleSubmit(newValue)
    } else {
      setLocalValue(newValue)
    }
  }, [isControlled, handleSubmit])

  return (
    <div className={className}>
      <Command>
        <SearchBarInput
          value={getInputValue()}
          onValueChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClassName ?? 'h-9'}
        />
      </Command>
    </div>
  )
}
