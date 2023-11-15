import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EyeOff
} from '@ttab/elephant-ui/icons'
import { type Column } from '@tanstack/react-table'

import { cn } from '@ttab/elephant-ui/utils'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

interface ColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export const ColumnHeader = <TData, TValue>({
  column,
  title,
  className
}: ColumnHeaderProps<TData, TValue>): JSX.Element => {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const SortIconElement = {
    desc: <ArrowDown className="ml-2 h-4 w-4" />,
    asc: <ArrowUp className="ml-2 h-4 w-4" />,
    default: <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
              {SortIconElement[column.getIsSorted() || 'default']}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
