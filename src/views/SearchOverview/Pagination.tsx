import React, { type SetStateAction } from 'react'
import { ArrowLeftFromLine, ArrowRightFromLine } from '@ttab/elephant-ui/icons'

interface Props {
  page: number
  total: number
  setPage: React.Dispatch<SetStateAction<number>>
}

export const Pagination = ({ page = 1, total = 0, setPage }: Props): JSX.Element => {
  const maxNumberOfPages = Math.floor((total) / 100) + 1

  const buttons = [
    {
      id: 'left-arrow',
      icon: ArrowLeftFromLine,
      onClick: () => setPage(page - 1),
      disabled: page <= 1
    },
    {
      id: 'right-arrow',
      icon: ArrowRightFromLine,
      onClick: () => setPage(page + 1),
      disabled: page === maxNumberOfPages
    }
  ]

  return (
    <div className='flex items-center justify-center gap-4 border-t w-full p-4'>
      {total > 0
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
