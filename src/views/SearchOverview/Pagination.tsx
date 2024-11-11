import { Button } from '@ttab/elephant-ui'
import React, { SetStateAction } from 'react'

interface Props {
  page: number
  total: number
  setPage: React.Dispatch<SetStateAction<number>>
}

export const Pagination = ({ page = 1, total = 0, setPage }: Props) => {
  const maxNumberOfPages = Math.floor((total) / 100) + 1

  return (
    <div className='flex items-center gap-2'>
      {total > 0 ? (
        <>
          <Button
            variant='ghost'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >Föregående</Button>
          <Button
            variant='ghost'
            disabled={page === maxNumberOfPages}
            onClick={() => setPage(page + 1)}
          >Nästa</Button>
        </>
      ) : null}
    </div>
  )
}
