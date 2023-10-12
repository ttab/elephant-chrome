import { NavigationActionType, useNavigationDispatch, useNavigationState } from './contexts/navigation'
import { v4 as uuid } from 'uuid'
import * as components from './components/test'

interface LinkProps {
  label: string
  component: any
  props?: any
}

function Link ({ label, component, props }: LinkProps) {
  const dispatch = useNavigationDispatch()
  return (
    <a
      className='p-1 hover:font-bold'
      onClick={(event) => {
        event.preventDefault()
        const id = uuid()
        dispatch({ type: NavigationActionType.ADD, content: component })
        history.pushState({
          id,
          props
        }, label, `${label.toLowerCase()}?id=${id}`)
      }}
    >
      {label}
    </a>
  )
}
function App (): JSX.Element {
  const state = useNavigationState()
  return (
      <div className='h-screen'>
        <div className="flex flex-row w-screen justify-between px-2">
          <nav className='flex flex-row'>
            <Link label='Small' component={components.Small} props={{ }}/>
            <Link label='Medium' component={components.Medium} />
            <Link label='Large' component={components.Large} />
          </nav>

        </div>
        <div className="flex flex-column gap-4 bg-gray-500 p-2 h-full">
          {state.content}
        </div>
      </div>
  )
}

export default App
