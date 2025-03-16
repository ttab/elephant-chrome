import { Popover, PopoverTrigger, PopoverContent,
  Select, SelectTrigger, SelectContent, SelectItem,
  ToggleGroup, ToggleGroupItem,
  Button,
  Label
} from '@ttab/elephant-ui'
import { ArrowDownNarrowWide, ArrowUpDown, ArrowUpWideNarrow, Settings2 } from '@ttab/elephant-ui/icons'
import { useMemo, useState } from 'react'
import { useTable } from '../hooks'

export const Sort = <TData,>() => {
  const { table } = useTable<TData>()
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState('asc')
  const [quickSort, setQuickSort] = useState('')

  const { grouping, sorting } = table.getState()

  const groupableColumns = useMemo(() =>
    table.getAllColumns()
      .filter((column) => column.getCanGroup()), [table])

  const sortableColumns = useMemo(() =>
    table.getAllColumns()
      .filter((column) => column.getCanSort()), [table])

  const handleQuickSortChange = (value: string) => {
    if (value === '') {
      table.setGrouping(['newsvalue'])
      table.setSorting([])
      setQuickSort('')
      return
    }
    table.setGrouping([value])
    table.setSorting([{ id: value, desc: value !== 'time' }])
    setQuickSort(value)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='xs'
          role='combobox'
          aria-expanded={open}
        >
          <ArrowUpDown
            size={18}
            strokeWidth={1.75}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='' align='start'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-row gap-4 items-center'>
            <Settings2 strokeWidth={1.75} size={18} />
            <ToggleGroup
              type='single'
              size='xs'
              value={quickSort}
              onValueChange={handleQuickSortChange}
            >
              {sortableColumns.find((column) => column.id === 'startTime')
              && (
                <ToggleGroupItem
                  value='startTime'
                  aria-label='Sortera efter tid'
                  className='border data-[state=off]:text-muted-foreground'
                >
                  Tid
                </ToggleGroupItem>
              )}
              <ToggleGroupItem
                value='newsvalue'
                aria-label='Sortera efter nyhetsvärde'
                className='border data-[state=off]:text-muted-foreground'
              >
                Nyhetsvärde
              </ToggleGroupItem>
              <ToggleGroupItem
                value='section'
                aria-label='Sortera efter sektion'
                className='border data-[state=off]:text-muted-foreground'
              >
                Sektion
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Label htmlFor='grouping'>Gruppera</Label>
          <Select
            value={grouping[0]}
            onValueChange={(option) => {
              setQuickSort('')

              if (option === 'none') {
                table.setGrouping([])
                return
              }

              table.setGrouping([option])
            }}
          >
            <SelectTrigger>
              {groupableColumns.find((column) => column.id === grouping[0])?.columnDef.meta?.name || 'Välj gruppering'}
            </SelectTrigger>
            <SelectContent id='grouping'>
              <SelectItem value='none'>Ingen gruppering</SelectItem>
              {groupableColumns.map((column) => (
                <SelectItem value={column.id} key={column.id}>{column.columnDef.meta?.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor='sorting'>Sortera</Label>
          <div className='flex flex-row gap-2'>
            <Select
              value={sorting[0]?.id || 'none'}
              onValueChange={(option) => {
                setQuickSort('')

                if (option === 'none') {
                  table.setSorting([])
                  return
                }

                table.setSorting([{ id: option, desc: order === 'desc' }])
              }}
            >
              <SelectTrigger>
                {sortableColumns
                  .find((column) => column.id === sorting[0]?.id)
                  ?.columnDef.meta?.name || 'Förinställd sortering'}
              </SelectTrigger>
              <SelectContent id='sorting'>
                <SelectItem value='none'>Förinställd sortering</SelectItem>
                {sortableColumns.map((column) => (
                  <SelectItem value={column.id} key={column.id}>{column.columnDef.meta?.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='icon'
              disabled={sorting.length === 0}
              onClick={() => {
                setOrder(order === 'asc' ? 'desc' : 'asc')

                table.setSorting([{ id: sorting[0]?.id, desc: order === 'desc' }])
              }}
            >
              {order === 'asc'
                ? <ArrowDownNarrowWide strokeWidth={1.75} size={18} />
                : <ArrowUpWideNarrow strokeWidth={1.75} size={18} />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
