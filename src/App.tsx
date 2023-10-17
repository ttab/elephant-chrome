import { NavigationActionType, useNavigationDispatch, useNavigationState } from '@/contexts'
import { v4 as uuid } from 'uuid'
import * as views from './views'

interface LinkProps {
  label: string
  component: any
  props?: Record<string, unknown>
}

function Link({ label, component, props }: LinkProps): JSX.Element {
  const dispatch = useNavigationDispatch()
  return (
    <a
      className='p-1 hover:font-bold'
      onClick={(event) => {
        event.preventDefault()
        const id = uuid()
        const args = { ...props, id }
        dispatch({
          type: NavigationActionType.ADD,
          content: component,
          componentName: component.displayName,
          props: args,
          id
        })

        history.pushState({
          id,
          props: { ...props, id },
          itemName: component.displayName,
          contentState: [
            ...history.state.contentState,
            { id, componentName: component.displayName, props: args }
          ]
        }, label, `${label.toLowerCase()}?id=${id}`)
      }}
    >
      {label}
    </a>
  )
}
function App(): JSX.Element {
  const state = useNavigationState()
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
