import type { FilterProps } from '@/components/Filter'
import { useQuery } from '@/hooks/useQuery'
import { useSections } from '@/hooks/useSections'
import { CommandItem } from '@ttab/elephant-ui'
import { CheckIcon, Shapes } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const SectionFilter = ({ page, pages, setPages, setSearch, facets }: {
  facets?: Map<string, number>
} & FilterProps): JSX.Element | undefined => {
  const [filter, setFilter] = useQuery(['section'])
  const sections = new Set(filter.section)
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  if (!page) {
    return (
      <CommandItem
        onSelect={() => {
          setPages([...pages, 'section'])
          setSearch('')
        }}
        className='flex gap-1 items-center'
      >
        <Shapes size={18} strokeWidth={1.75} />
        Sektion
      </CommandItem>
    )
  }

  if (page === 'section') {
    return (
      <>
        {allSections.map((section) => {
          const isSelected = sections?.has?.(section.value)

          return (
            <CommandItem
              className='flex gap-1 items-center'
              key={section.value}
              onSelect={() => {
                if (isSelected) {
                  sections.delete(section.value)
                } else {
                  sections.add(section.value)
                }

                setFilter({ ...filter, section: Array.from(sections) })
              }}
            >
              <div
                className={cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <CheckIcon size={18} strokeWidth={1.75} />
              </div>
              <span>{section.label}</span>
              <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                {facets?.get(section.value) && (
                  <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                    {facets.get(section.value) || 0}
                  </span>
                )}
              </span>
            </CommandItem>
          )
        })}
      </>
    )
  }
}

