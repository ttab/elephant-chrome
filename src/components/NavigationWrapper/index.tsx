import { useMemo } from 'react'
import { useNavigation } from '@/hooks'

export const NavigationWrapper = ({ children, id }: { children: JSX.Element, id: string }): JSX.Element => {
  const { state } = useNavigation()
  return useMemo(() => {
    const variants = {
      maximized: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full rounded-lg p-2',
      minimized: 'relative group flex-grow bg-white dark:bg-background basis-full pl-2 first:border-none border-l-2 border-gray-100 dark:border-gray-500'
    }

    return (
      <section
        className={state.focus === id
          ? variants.maximized
          : variants.minimized}
      >
        {children}
      </section>
    )
  }, [children, id, state.focus])
}
