import { useEffect, useMemo, useRef } from 'react'
import { useHistory, useView } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

/**
 * Each view is defined to be a @container named "view". When styling components that needs
 * to change depending on @component size, use e.g:
 *
 * <div className="hidden @lg/view:block">Only shown in @lg sized components</div>
 */
const section = cva('@container/view first:border-l-0', {
  variants: {
    isActive: {
      true: 'shadow-3xl rounded-t-2xl overflow-hidden is-active ml-[1px] first:ml-[0]',
      false: 'opacity-90 border-l [.is-active+&]:border-0 [.is-active+&]:ml-[1px]'
    },
    isFocused: {
      true: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full',
      false: 'relative group/view-container'
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

export const ViewContainer = ({ children, colSpan: wantedColSpan }: {
  children: JSX.Element
  colSpan: number
}): JSX.Element => {
  const { state, replaceState, setActiveView } = useHistory()
  const { viewId, isActive, isFocused, isHidden } = useView()
  const sectionRef = useRef<HTMLElement>(null)

  // Ensure supported colspan is used as well as correct type
  const colSpan = (
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(wantedColSpan)
      ? wantedColSpan
      : 12
  ) as keyof typeof section

  useEffect(() => {
    const handleSetActive = (e: MouseEvent): void => {
      if (!isActive && sectionRef.current?.contains(e.target as Node)) {
        setActiveView(viewId)
      }
    }

    document.addEventListener('click', handleSetActive)
    return () => document.removeEventListener('click', handleSetActive)
  }, [viewId, isActive, state?.contentState, replaceState, setActiveView])

  return useMemo(() => {
    return (
      <section
        ref={sectionRef}
        className={cn(
          section({
            isActive,
            isFocused,
            isHidden,
            colSpan
          })
        )}
      >
        {children}
      </section>
    )
  }, [children, isFocused, isHidden, isActive, colSpan])
}
