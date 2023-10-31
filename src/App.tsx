import { useNavigation, useSession } from '@/hooks'
import { Link } from '@/components'
import { Login } from './views/auth/Login'

export const App = (): JSX.Element => {
  const jwt = useSession()
  const { state } = useNavigation()

  return (
    <div className='relative flex h-screen flex-col bg-white dark:bg-black'>
      {!jwt
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
  )
}
