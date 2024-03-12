import { useMemo } from 'react'
import { useNavigation, useView } from '@/hooks'
import { NavigationActionType } from '@/types'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

/**
 * Each view is defined to be a @container named "view". When styling components that needs
 * to change depending on @component size, use e.g:
 *
 * <div className="hidden @lg/view:block">Only shown in @lg sized components</div>
 */
const section = cva('@container/view', {
  variants: {
    isActive: {
      true: 'border-t-green-500 border-t-4',
      false: 'border-t-transparent border-t-4'
    },
    isFocused: {
      true: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full',
      false: 'relative group'
    },
    isHidden: {
      true: 'hidden',
      false: null
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
  const { viewId, isActive, isFocused, isHidden } = useView()

  // Ensure supported colspan is used as well as correct type
  const colSpan = (
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(wantedColSpan)
      ? wantedColSpan
      : 12
  ) as keyof typeof section

  // Make sure content does not rerender every time active view changes
  const memoizedContent = useMemo((): JSX.Element => {
    return <>{children}</>
  }, [children])

  return useMemo(() => {
    return (
      <section
        onClick={() => {
          if (!isActive) {
            dispatch({
              viewId,
              type: NavigationActionType.ACTIVE
            })
          }
        }}
        className={cn(
          section({
            isActive,
            isFocused,
            isHidden,
            colSpan
          })
        )}
      >
        {memoizedContent}
      </section>
    )
  }, [memoizedContent, viewId, dispatch, isFocused, isHidden, isActive, colSpan])
}
