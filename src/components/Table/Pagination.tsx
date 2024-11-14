import { useQuery } from '@/hooks/useQuery'
import { Button } from '@ttab/elephant-ui'
import { useCallback } from 'react'

export const Pagination = (): JSX.Element => {
  const [{ page = '1' }, setQuery] = useQuery()

  const setPage = useCallback((page: number) => {
    setQuery({ page: page.toString() })
  }, [setQuery])

  return (
    <div className='flex items-center justify-end space-x-2 p-6'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          const newPage = Number(page) - 1
          if (newPage > 1) {
            setPage(Number(page) - 1)
          } else {
            setQuery({ page: undefined })
          }
        }}
        disabled={page === '1'}
      >
        Previous
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setPage(Number(page) + 1)}
        // FIXME: Get total pages
        // disabled={}
      >
        Next
      </Button>
    </div>
  )
}
