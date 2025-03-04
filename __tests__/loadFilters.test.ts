import type { QueryParams } from '@/hooks/useQuery'
import { loadFilters } from '@/lib/loadFilters'
import { planningListColumns } from '@/views/PlanningOverview/PlanningListColumns'
import type { ColumnFiltersState } from '@tanstack/react-table'

describe('loadFilters', () => {
  it('should return the correct filters', () => {
    const query: QueryParams | undefined = undefined
    const columns = planningListColumns({ sections: [], authors: [] })
    const savedFilters: QueryParams | undefined = {
      section: ['abc', 'def'],
      newsvalue: ['4']
    }

    const expected: ColumnFiltersState = [
      { id: 'section', value: ['abc', 'def'] },
      { id: 'newsvalue', value: ['4'] }
    ]

    const result = loadFilters(query, columns, savedFilters)
    expect(result).toEqual(expected)
  })
})
