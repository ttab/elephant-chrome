import { useNavigation } from '@/hooks'
import { Link } from '@/components'

const App = (): JSX.Element => {
  const { state } = useNavigation()
  return (
    <div className='relative flex h-screen flex-col bg-white dark:bg-black'>
      <nav className='flex flex-row'>
        <Link to='Editor'>Editor</Link>
        <Link to='Planning'>Planning</Link>
      </nav>
      <div className="flex flex-1 gap-4 bg-gray-500 p-2 h-max">
        {state.content}
      </div>
    </div>
  )
}

export default App
