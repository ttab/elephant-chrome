import { updateFilter } from '../src/lib/loadFilters'
import type { ColumnFiltersState } from '@tanstack/react-table'

describe('updateFilter', () => {
  it('should update and convert columnFilters to query object, removed values are set as undefined', () => {
    const previous: ColumnFiltersState = [
      {
        id: 'newsvalue',
        value: ['4']
      },
      {
        id: 'section',
        value: [
          '0730efa9-43f2-468d-979a-aaffc74d7582',
          '111932dc-99f3-4ba4-acf2-ed9d9f2f1c7c'
        ]
      }
    ]

    const updated: ColumnFiltersState = [
      {
        id: 'section',
        value: [
          '0730efa9-43f2-468d-979a-aaffc74d7582',
          '111932dc-99f3-4ba4-acf2-ed9d9f2f1c7c'
        ]
      }
    ]

    const result = updateFilter(updated, previous)

    expect(result).toEqual({
      section: [
        '0730efa9-43f2-468d-979a-aaffc74d7582',
        '111932dc-99f3-4ba4-acf2-ed9d9f2f1c7c'
      ],
      newsvalue: undefined
    })
  })
})
