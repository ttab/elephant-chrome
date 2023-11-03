import { useNavigation, useSession } from '@/hooks'
import { AppHeader } from '@/components'
import { Login } from '@/views/auth/Login'
import { CommandMenu } from '@/components/CommandMenu'

export const App = (): JSX.Element => {
  const jwt = useSession()
  const { state } = useNavigation()

  return (
    <div className='relative flex h-screen flex-col bg-white dark:bg-black'>
      {!jwt
        ? <Login />
        : (
            <>
              <div className='absolute top-0 right-0 w-28 h-10 p-2 z-10 justify-end flex'>
                <CommandMenu />
                <AppHeader />
              </div>
              <div className='flex flex-1 gap-4 p-2 h-max'>
                {state.content}
              </div>
            </>
          )
      }
    </div>
  )
}
