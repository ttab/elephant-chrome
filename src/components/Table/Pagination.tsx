import { useCallback } from 'react'
import { ArrowLeftFromLine, ArrowRightFromLine } from '@ttab/elephant-ui/icons'
import { useQuery } from '@/hooks'

export const Pagination = ({ total }: {
  total?: number
}): JSX.Element => {
  const [{ page = '1' }, setQuery] = useQuery()

  const setPage = useCallback((page: number) => {
    setQuery({ page: page.toString() })
  }, [setQuery])

  const maxNumberOfPages = total && Math.floor((total) / 100) + 1

  const buttons = [
    {
      id: 'left-arrow',
      icon: ArrowLeftFromLine,
      onClick: () => {
        const newPage = Number(page) - 1
        if (newPage > 1) {
          setPage(Number(page) - 1)
        } else {
          setQuery({ page: undefined })
        }
      },
      disabled: Number(page) <= 1
    },
    {
      id: 'right-arrow',
      icon: ArrowRightFromLine,
      onClick: () => setPage(Number(page) + 1),
      disabled: Number(page) === maxNumberOfPages
    }
  ]

  return (
    <div className='flex items-center justify-center gap-4 border-t w-full p-4'>
      {total === undefined || total > 0
        ? (
            <>
              {buttons.map((button, index) => (
                <div key={button.id} className='flex items-center gap-2'>
                  <div
                    className={`flex items-center gap-2 ${button.disabled ? '' : 'cursor-pointer hover:bg-slate-200'}`}
                    onClick={() => {
                      if (button.disabled) {
                        return
                      }
                      button.onClick()
                    }}
                  >
                    <button.icon size={20} color={button.disabled ? '#E2E8F0' : '#000'} />
                  </div>
                  {index === 0 && <span className='text-sm ml-2'>{page}</span>}
                </div>
              ))}
            </>
          )
        : null}
    </div>
  )
}
