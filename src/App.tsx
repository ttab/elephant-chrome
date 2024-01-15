import { useNavigation, useSession } from '@/hooks'
import { AppHeader } from '@/components'
import { Login } from '@/views/auth/Login'

export const App = (): JSX.Element => {
  const { jwt } = useSession()
  const { state } = useNavigation()

  if (!jwt) {
    return <div className='relative flex h-screen flex-col'>
      <Login />
    </div>
  }

  return (
    <div className='relative flex h-screen flex-col'>
      <div className='absolute top-0 right-0 h-10 p-1 z-10'>
        <AppHeader />
      </div>

      <div className='grid grid-cols-12 divide-x-2 h-max'>
        {state.content}
      </div>
    </div>
  )
}
