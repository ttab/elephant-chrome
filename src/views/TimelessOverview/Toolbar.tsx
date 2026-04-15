import {
  Command,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ttab/elephant-ui'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery } from '@/hooks/useQuery'
import { useTimelessCategories } from '@/hooks/useTimelessCategories'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const Toolbar = (): JSX.Element => {
  const [filter, setFilter] = useQuery(['query', 'category'])
  const categories = useTimelessCategories()
  const { t } = useTranslation(['shared', 'views'])

  return (
    <div className='bg-table-bg flex items-center justify-between py-1 px-4 border-b sticky top-0 z-10'>
      <div className='flex flex-1 items-center space-x-2'>
        <Command
          className='[&_[cmdk-input-wrapper]]:border-none'
        >
          <DebouncedCommandInput
            value={filter.query?.[0]}
            onChange={(value: string | undefined) => {
              if (value) {
                setFilter({ ...filter, query: [value] })
              } else {
                const { query: _, ...rest } = filter
                setFilter(rest)
              }
            }}
            placeholder={t('shared:toolbar.freeTextSearch')}
            className='h-9'
          />
        </Command>

        <Select
          value={filter.category?.[0] ?? 'all'}
          onValueChange={(value) => {
            if (value && value !== 'all') {
              setFilter({ ...filter, category: [value] })
            } else {
              const { category: _, ...rest } = filter
              setFilter(rest)
            }
          }}
        >
          <SelectTrigger className='w-[180px] h-9'>
            <SelectValue placeholder={t('views:timeless.columnLabels.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>
              {t('views:timeless.toolbar.allCategories')}
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
