import { useNavigation } from '@/hooks'
import { AppHeader } from '@/components'

const App = (): JSX.Element => {
  const { state } = useNavigation()
  return (
    <div className='relative flex h-screen flex-col bg-white dark:bg-black'>
      <div className='absolute top-0 right-0 w-28 h-10 p-2 z-10 justify-end flex'>
        <AppHeader />
      </div>
      <div className='flex flex-1 gap-4 p-2 h-max'>
        {state.content}
      </div>
    </div>
  )
}

export default App
