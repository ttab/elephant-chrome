import { ViewHeader } from '@/components'

export const Editor = (): JSX.Element => {
  return (
    <>
      <ViewHeader title='Editor' />
      <main>
        <p>
          Editor content
        </p>
      </main>
    </>
  )
}

Editor.displayName = 'Editor'
