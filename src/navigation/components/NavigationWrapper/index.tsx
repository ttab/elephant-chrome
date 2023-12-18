import { useMemo } from 'react'
import { useNavigation } from '@/hooks'
import { NavigationActionType } from '@/types'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

// TODO: Implement use of @container queries through @tailwindcss/container-queries

const section = cva('', {
  variants: {
    active: {
      true: 'border-t-green-500 border-t-4',
      false: 'border-t-transparent border-t-4'
    },
    focused: {
      true: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full',
      false: 'relative group'
    },
    size: {
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
    focused: true,
    className: 'col-span-12'
  }]
})

export const NavigationWrapper = ({ children, id, colSpan }: {
  children: JSX.Element
  id: string | undefined
  name: string
  colSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
}): JSX.Element => {
  const { state, dispatch } = useNavigation()

  return useMemo(() => {
    return (
      <section
        onClick={() => {
          if (state.active !== id) {
            dispatch({
              type: NavigationActionType.ACTIVE,
              id
            })
          }
        }}
        className={cn(
          section({
            active: state.active === id,
            focused: state.focus === id,
            size: colSpan
          })
        )}
      >
        {children}
      </section>
    )
  }, [children, id, state.focus, dispatch, state.active, colSpan])
}
