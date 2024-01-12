import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'
import { SignalMedium } from '@ttab/elephant-ui/icons'

interface NewsScoreDropDownProps {
  value: string
  options: Array<{
    label: string
    value: string | number
    icon?: JSX.Element
  }>
  onChange: (value: unknown) => void
}
export function NewsValueScoreDropDown({ value, options, onChange }: NewsScoreDropDownProps): JSX.Element {
  const option = options.find(option => option.value === value)
  const Icon = option?.icon || <SignalMedium />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 p-0 px-2 data-[state=open]:bg-muted items-start"
        >
          <span className={`flex items-end ${!option?.label ? 'opacity-40' : ''}`}>
            {Icon}
            {option?.label || '∞'}
          </span>

          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((priority) => {
          return (
            <DropdownMenuItem key={priority.value}>
              <span
                className="flex items-end text-sm"
                onClick={() => { onChange(priority.value) }}
              >
                {!!priority.icon && (priority.icon)}
                {priority.label}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
