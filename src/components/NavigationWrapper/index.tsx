import { useMemo } from 'react'

export const NavigationWrapper = ({ children }: { children: JSX.Element }): JSX.Element => {
  return useMemo(() => {
    const variants = {
      maximized: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full rounded-lg p-2',
      minimized: 'relative group flex-grow bg-white dark:bg-background basis-full p-2 min-w-max first:border-none border-l-2 border-gray-100 dark:border-gray-500'
    }
    return (
      <section
        className={variants.minimized}
      >
          {children}
      </section>
    )
  }, [children])
}
