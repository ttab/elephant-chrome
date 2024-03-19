import { Awareness } from '@/components'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip
} from '@ttab/elephant-ui'
import { SignalMedium } from '@ttab/elephant-ui/icons'
import { useRef, type PropsWithChildren } from 'react'

interface NewsScoreDropDownProps {
  value: string
  options: Array<{
    label: string
    value: string | number
    icon?: JSX.Element
  }>
  onChange: (value: unknown) => void
}

export const NewsValueScoreDropDown = ({ value, options, onChange }: NewsScoreDropDownProps): JSX.Element => {
  const option = options.find(option => option.value === value)
  const Icon = option?.icon || <SignalMedium size={18} strokeWidth={1.75} />
  const setFocused = useRef<(value: boolean) => void>(null)

  return (
    <Awareness name="NewsValueScore" ref={setFocused}>
      <DropdownMenu onOpenChange={(isOpen) => {
        if (setFocused?.current) {
          setFocused.current(isOpen)
        }
      }}>
        <NewsValueScore text={`News value priority ${option?.label}`}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-10 p-0 px-2 data-[state=open]:bg-muted items-center"
            >
              <span className={`flex ${!option?.label ? 'opacity-40' : ''}`}>
                {Icon}
                {option?.label || '∞'}
              </span>

              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
        </NewsValueScore>

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
    </Awareness>
  )
}

interface NewsValueScoreProps extends PropsWithChildren {
  text: string
}

function NewsValueScore({ text, children }: NewsValueScoreProps): JSX.Element {
  return (
    <Tooltip content={text}>
      {children}
    </Tooltip>
  )
}
