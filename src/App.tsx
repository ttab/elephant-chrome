import { Editor } from '@/views/Editor'

export const App = (): JSX.Element => {
  return (
    <div className='relative flex min-h-screen flex-col bg-white dark:bg-black'>
      <Editor />
    </div>
  )
}
