import { Editor } from '@/views/Editor'
import { ApiProvider } from './contexts/ApiProvider'

export const App = (): JSX.Element => {
  const apiHost = import.meta.env.VITE_API_HOST
  const apiPort = import.meta.env.VITE_API_PORT

  return (
    <ApiProvider host={apiHost} port={apiPort}>
      <div className='relative flex min-h-screen flex-col bg-white dark:bg-black'>
        <Editor />
      </div>
    </ApiProvider>
  )
}
