import { useNavigation, useSession } from '@/hooks'
import { AppHeader } from '@/components'
import { ApiProvider } from '@/contexts/ApiProvider'
import { Login } from './views/auth/Login'

export const App = (): JSX.Element => {
  const jwt = useSession()
  const { state } = useNavigation()

  return (
    <ApiProvider protocol={apiProtocol} host={apiHost} port={apiPort} session={session}>
      <div className='relative flex h-screen flex-col bg-white dark:bg-black'>

        {!session.jwt
          ? <Login />
          : (
              <>
                <div className='absolute top-0 right-0 w-28 h-10 p-2 z-10 justify-end flex'>
                  <AppHeader />
                </div>
                <div className='flex flex-1 gap-4 p-2 h-max'>
                  {state.content}
                </div>
              </>
            )}
      </div>
    </ApiProvider>
  )
}
