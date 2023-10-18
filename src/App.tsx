import * as views from './views'
import { useNavigation } from '@/hooks'
import { Link } from '@/components'

function App(): JSX.Element {
  const { state } = useNavigation()
  return (
      <div className='h-screen'>
        <div className="flex flex-row w-screen justify-between px-2">
          <nav className='flex flex-row'>
            <Link label='Small' component={views.Small} props={{ }}/>
            <Link label='Medium' component={views.Medium} />
            <Link label='Large' component={views.Large} />
          </nav>
        </div>
        <div className="flex flex-column gap-4 bg-gray-500 p-2 h-full">
          {state.content}
        </div>
      </div>
  )
}

export default App
