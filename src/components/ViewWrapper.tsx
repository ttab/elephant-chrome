import { useMemo } from 'react'
import { useNavigation, useView } from '@/hooks'
import { NavigationActionType } from '@/types'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

// TODO: Implement use of @container queries through @tailwindcss/container-queries

const section = cva('', {
  variants: {
    isActive: {
      true: 'border-t-green-500 border-t-4',
      false: 'border-t-transparent border-t-4'
    },
    isFocused: {
      true: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full',
      false: 'relative group'
    },
    colSpan: {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12'
    }
  },
  compoundVariants: [{
    isFocused: true,
    className: 'col-span-12'
  }]
})

export const ViewWrapper = ({ children, colSpan: wantedColSpan }: {
  children: JSX.Element
  colSpan: number
}): JSX.Element => {
  const { dispatch } = useNavigation()
  const { id, isActive, isFocused } = useView()

  // Ensure supported colspan is used as well as correct type
  const colSpan = (
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(wantedColSpan)
      ? wantedColSpan
      : 12
  ) as keyof typeof section

  return useMemo(() => {
    return (
      <section
        onClick={() => {
          if (!isActive) {
            dispatch({
              id,
              type: NavigationActionType.ACTIVE
            })
          }
        }}
        className={cn(
          section({
            isActive,
            isFocused,
            colSpan
          })
        )}
      >
        {children}
      </section>
    )
  }, [children, id, dispatch, isFocused, isActive, colSpan])
}
