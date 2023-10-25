import { useNavigation } from '@/hooks'
import { Link } from '@/components'

const App = (): JSX.Element => {
  const { state } = useNavigation()
  return (
      <div className='h-screen'>
        <div className="flex flex-row w-screen justify-between px-2">
          <nav className='flex flex-row'>
            <Link to='Small'>Small</Link>
            <Link to='Medium'>Medium</Link>
            <Link to='Large'>Large</Link>
          </nav>
        </div>
        <div className="flex flex-column gap-4 bg-gray-500 p-2 h-full">
          {state.content}
        </div>
      </div>
  )
}

export default App
