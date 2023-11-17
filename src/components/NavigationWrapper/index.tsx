import { useMemo } from 'react'
import { useNavigation } from '@/hooks'

export const NavigationWrapper = ({ children, id }: { children: JSX.Element, id: string | undefined }): JSX.Element => {
  const { state } = useNavigation()

  return useMemo(() => {
    const variants = {
      maximized: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full p-2',
      minimized: 'relative group flex-grow basis-full p-2'
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
