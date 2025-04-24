import { useLink } from '@/hooks/useLink'
import { Button, Label, Popover, PopoverContent, PopoverTrigger, Input, Command, CommandInput, CommandList, CommandItem } from '@ttab/elephant-ui'
import { CircleCheckBig, TriangleAlert, X, Eye, ChevronDown } from '@ttab/elephant-ui/icons'
import type { Block } from '@ttab/elephant-api/newsdoc'
/**
 * LayoutBox component.
 *
 * This component represents a layout option in the Print Editor. It allows users to select
 * and manage different layout configurations for their document. The component provides
 * options to preview the layout and manage bulk selections.
 *
 * @param {Object} props - The properties object.
 * @param {string[]} props.bulkSelected - An array of selected layout IDs for bulk operations.
 * @param {Function} props.setBulkSelected - A function to update the bulk selected layouts.
 * @param {boolean} props.valid - A flag indicating if the layout is valid for selection.
 * @param {number} props.id - The unique identifier for the layout.
 * @param {string} props.name - The name of the layout.
 *
 * @returns {JSX.Element} The rendered LayoutBox component.
 *
 * @remarks
 * The component uses the `useLink` hook to open a preview of the layout. It also includes
 * a list of predefined layouts that can be selected and managed.
 */

export function LayoutBox({
  bulkSelected,
  setBulkSelected,
  layout
}: {
  bulkSelected: string[]
  setBulkSelected: (bulkSelected: string[]) => void
  layout: Block
}) {
  const openPreview = useLink('PrintPreview')
  const layouts = [
    {
      name: 'Ej implementerat',
      value: 'ej-implementerat'
    }
  ]
  const valid = true
  const id = layout.id
  const name = layout.links?.find((l) => l.rel === 'layout')?.name
  const additionals = layout?.meta[0]?.content
  const position = layout?.data?.position || 'error'
  return (
    <div className='border min-h-32 p-2 pt-0 grid grid-cols-12 gap-2 rounded'>
      <header className='col-span-12 row-span-1 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {valid
            ? (
                <CircleCheckBig strokeWidth={1.75} size={18} color='green' />
              )
            : (
                <TriangleAlert strokeWidth={1.75} size={18} color='red' />
              )}
          <Button
            variant='ghost'
            className='px-2 py-0'
            size='sm'
            onClick={() => openPreview(undefined, { id: id.toString() })}
          >
            <Eye strokeWidth={1.75} size={16} />
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <Label className='group/check flex items-center gap-4'>
            <span className='transition-opacity ease-in-out delay-500 opacity-0 group-hover/check:opacity-100'>
              {bulkSelected.includes(id.toString()) ? '' : 'Välj'}
            </span>
            <Input
              value={id}
              type='checkbox'
              className='w-4 h-4'
              checked={bulkSelected.includes(id.toString())}
              onChange={(e) => {
                if (e.target.checked) {
                  setBulkSelected([...bulkSelected, id.toString()])
                } else {
                  setBulkSelected(bulkSelected.filter((_id) => _id !== id.toString()))
                }
              }}
            />
          </Label>
          <Button
            variant='ghost'
            className='p-2'
            onClick={(e) => {
              e.preventDefault()
              window.alert('Ej implementerat')
            }}
          >
            <X strokeWidth={1.75} size={18} />
          </Button>
        </div>
      </header>
      <div className='col-span-12 row-span-1'>
        <Input type='text' placeholder='Namn' defaultValue={name} />
      </div>
      <div className='col-span-6 row-span-1'>
        <Popover>
          <PopoverTrigger className='w-full'>
            <div className='text-sm border rounded-md p-2 flex gap-1 items-center justify-between w-full'>
              {position}
              <ChevronDown strokeWidth={1.75} size={18} />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput placeholder='Sök' />
              <CommandList className='text-sm bg-white'>
                {layouts.map((layout) => (
                  <CommandItem key={layout.value} className='bg-white'>
                    {layout.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className='col-span-6 row-span-1'>
        <Popover>
          <PopoverTrigger className='w-full'>
            <div className='text-sm border rounded-md p-2 flex gap-1 items-center justify-between w-full'>
              2
              <ChevronDown strokeWidth={1.75} size={18} />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput placeholder='Sök' />
              <CommandList className='text-sm bg-white'>
                {layouts.map((layout) => (
                  <CommandItem key={layout.value} className='bg-white'>
                    {layout.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className='col-span-12 row-span-1 flex flex-col gap-2'>
        <h4 className='text-sm font-bold'>Tillägg</h4>
        {additionals?.map((additional) => (
          <Label key={additional.id} className='flex items-center gap-2'>
            <Input
              type='checkbox'
              className='w-4 h-4'
              defaultChecked={additional.value === 'true'}
            />
            {additional.name}
          </Label>
        ))}
      </div>
    </div>
  )
}
