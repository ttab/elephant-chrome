import { useNavigation, useSession } from '@/hooks'
import { AppHeader } from '@/components'
import { Login } from '@/views/auth/Login'
import { CommandMenu } from '@/components/CommandMenu'
import { useEffect, useRef } from 'react'

export const App = (): JSX.Element => {
  const { jwt } = useSession()
  const { state } = useNavigation()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('Rerender', state.views)
  }, [state.views])

  if (!jwt) {
    return <div className='relative flex h-screen flex-col bg-white dark:bg-black'>
      <Login />
    </div>
  }

  return (
    <div className='relative flex h-screen flex-col bg-white dark:bg-black'>
      <div className='absolute top-0 right-0 h-10 p-2 z-10 justify-end flex'>
        <CommandMenu />
        <AppHeader />
      </div>

      <div ref={contentRef} className='grid grid-cols-12 divide-x-2 h-max'>
        {state.content}
      </div>
    </div>
  )
}
