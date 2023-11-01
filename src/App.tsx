import { useNavigation, useSession } from '@/hooks'
import { Link } from '@/components'
import { ApiProvider } from '@/contexts/ApiProvider'
import { Login } from './views/auth/Login'

export const App = (): JSX.Element => {
  const apiProtocol = import.meta.env.VITE_PROTOCOL
  const apiHost = import.meta.env.VITE_API_HOST
  const apiPort = import.meta.env.VITE_API_PORT

  const session = useSession(`${apiProtocol}://${apiHost}:${apiPort}/api`)
  const { state } = useNavigation()

  return (
    <ApiProvider protocol={apiProtocol} host={apiHost} port={apiPort} session={session}>
      <div className='relative flex h-screen flex-col bg-white dark:bg-black'>

        {!session.jwt
          ? <Login />
          : <>
            <nav className='flex flex-row'>
              <Link key="editor" to='Editor'>Editor</Link>
              <Link key="planning" to='Planning'>Planning</Link>
            </nav>
            <div className="flex flex-1 gap-4 bg-gray-500 p-2 h-max">
              {state.content}
            </div>
          </>
        }
      </div>
    </ApiProvider>
  )
}
