import { useLink } from '@/hooks/useLink'
import { Button, Label, Popover, PopoverContent, PopoverTrigger, Input, Command, CommandInput, CommandList, CommandItem } from '@ttab/elephant-ui'
import { CircleCheckBig, TriangleAlert, X, Eye, ChevronDown } from '@ttab/elephant-ui/icons'

/**
 * LayoutBox component.
 *
 * This component represents a layout option in the Print Editor. It allows users to select
 * and manage different layout configurations for their document. The component provides
 * options to preview the layout and manage bulk selections.
 *
 * @param props - The properties object.
 * @param props.bulkSelected - An array of selected layout IDs for bulk operations.
 * @param props.setBulkSelected - A function to update the bulk selected layouts.
 * @param props.valid - A flag indicating if the layout is valid for selection.
 * @param props.id - The unique identifier for the layout.
 * @param props.name - The name of the layout.
 *
 * @returns The rendered LayoutBox component.
 *
 * @remarks
 * The component uses the `useLink` hook to open a preview of the layout. It also includes
 * a list of predefined layouts that can be selected and managed.
 */

type Layout = {
  id: string | undefined
  name: string
  links: {
    rel: string
    name: string
    href: string
  }[]
  meta: {
    content: string
    type: string
  }[]
  data: {
    position: string
  }
  type: string
}

export function LayoutBox({
  bulkSelected,
  setBulkSelected,
  layout,
  updateLayout,
  isDirty,
  setIsDirty,
  setLayouts,
  cleanLayouts,
  saveUpdates,
  deleteLayout
}: {
  bulkSelected: Array<string>
  setBulkSelected: React.Dispatch<React.SetStateAction<Array<string>>>
  layout: Layout
  updateLayout: (layout: Layout) => void
  isDirty: string | undefined
  setIsDirty: (id: string | undefined) => void
  setLayouts: React.Dispatch<React.SetStateAction<Layout[]>>
  cleanLayouts: Layout[]
  saveUpdates: () => void
  deleteLayout: (layout: Layout) => void
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
  const name = layout.links?.find((l: { rel: string }) => l.rel === 'layout')?.name
  const additionals = layout?.meta[0]?.content
  const layoutName = layout?.name
  const position = layout?.data?.position || ''

  return (
    <div id={layout.id} className='border min-h-32 p-2 pt-0 grid grid-cols-12 gap-2 rounded'>
      <header className={`col-span-12 row-span-1 gap-2 flex items-center ${isDirty === layout.id ? 'mt-2 justify-end' : 'justify-between'} `}>
        {isDirty !== layout.id
          ? (
              <>
                <div className='flex items-center gap-2'>
                  {valid
                    ? <CircleCheckBig strokeWidth={1.75} size={18} color='green' />
                    : <TriangleAlert strokeWidth={1.75} size={18} color='red' />}
                  <Button
                    variant='ghost'
                    className='px-2 py-0'
                    size='sm'
                    onClick={() => openPreview(undefined, { id: id?.toString() })}
                  >
                    <Eye strokeWidth={1.75} size={16} />
                  </Button>
                </div>
                <div className='flex items-center gap-2'>
                  <Label className='group/check flex items-center gap-4'>
                    <span className='transition-opacity ease-in-out delay-500 opacity-0 group-hover/check:opacity-100'>
                      {bulkSelected.includes(id?.toString() || '') ? '' : 'Välj'}
                    </span>
                    <Input
                      value={id}
                      type='checkbox'
                      className='w-4 h-4'
                      checked={bulkSelected.includes(id?.toString() || '')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkSelected([...bulkSelected, id?.toString() || ''])
                        } else {
                          setBulkSelected(bulkSelected.filter((_id) => _id !== id?.toString() || ''))
                        }
                      }}
                    />
                  </Label>
                  <Button
                    variant='ghost'
                    className='p-2'
                    onClick={(e) => {
                      e.preventDefault()
                      if (confirm('Är du säker på att du vill radera denna layouter?')) {
                        deleteLayout(layout)
                      }
                    }}
                  >
                    <X strokeWidth={1.75} size={18} />
                  </Button>
                </div>
              </>
            )
          : (
              <>
                <Button
                  className='p-2'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setIsDirty(undefined)
                    setLayouts(cleanLayouts)
                  }}
                >
                  Avbryt
                </Button>
                <Button className='p-2' size='sm' onClick={async () => await saveUpdates()}>Spara</Button>
              </>
            )}
      </header>
      <div className='col-span-12 row-span-1'>
        <Input
          type='text'
          placeholder='Namn'
          value={name}
          onChange={(e) => {
            const _links = layout.links.map((link) => {
              if (link.rel === 'layout') {
                return { ...link, name: e.target.value }
              }
              return link
            })
            const updatedLayout = Object.assign({}, layout, {
              links: _links
            })
            updateLayout(updatedLayout)
          }}
        />
      </div>
      <div className='col-span-6 row-span-1'>
        <Popover>
          <PopoverTrigger className='w-full'>
            <div className='text-sm border rounded-md p-2 flex gap-1 items-center justify-between w-full'>
              {layoutName}
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
        <Input
          type='text'
          placeholder='Position'
          value={position}
          onChange={(e) => {
            const updatedLayout = Object.assign({}, layout, {
              data: { position: e.target.value }
            })
            updateLayout(updatedLayout)
          }}
        />
      </div>
      <div className='col-span-12 row-span-1 flex flex-col gap-2'>
        {additionals?.length > 0 && (
          <>
            <h4 className='text-sm font-bold'>Tillägg</h4>
            {additionals?.map((additional) => (
              <Label key={additional.id} className='flex items-center gap-2'>
                <Input
                  type='checkbox'
                  className='w-4 h-4'
                  checked={additional.value === 'true'}
                  onChange={(e) => {
                    const updatedAdditionals = additionals.map((_additional) => {
                      if (_additional.name === additional.name) {
                        return { ..._additional, value: e.target.checked?.toString() }
                      }
                      return _additional
                    })
                    const _meta = layout.meta.map((_meta) => {
                      if (_meta.type === 'tt/print-features') {
                        return { ..._meta, content: updatedAdditionals }
                      }
                      return _meta
                    })
                    const updatedLayout = Object.assign({}, layout, {
                      meta: _meta
                    })
                    console.log('updatedLayout', updatedLayout)
                    updateLayout(updatedLayout)
                  }}
                />
                {additional.name}
              </Label>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
