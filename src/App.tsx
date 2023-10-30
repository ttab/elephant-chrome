import { Editor } from '@/views/Editor'
import { ApiProvider } from './contexts/ApiProvider'
import { useSession } from './hooks/useSession'
import { Login } from './views/auth/Login'

export const App = (): JSX.Element => {
  const apiProtocol = import.meta.env.VITE_PROTOCOL
  const apiHost = import.meta.env.VITE_API_HOST
  const apiPort = import.meta.env.VITE_API_PORT

  const session = useSession(`${apiProtocol}://${apiHost}:${apiPort}`)

  return (
    <ApiProvider protocol={apiProtocol} host={apiHost} port={apiPort} session={session}>
      <div className='relative flex min-h-screen flex-col bg-white dark:bg-black'>
        {!!session.jwt &&
          <Editor />
        }
        {!session.jwt &&
          <Login />
        }
      </div>
    </ApiProvider>
  )
}
