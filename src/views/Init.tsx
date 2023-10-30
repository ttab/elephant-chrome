import { ViewHeader } from '@/components'

export const Init = (): JSX.Element => {
  return (
    <>
      <ViewHeader title='Init' />
      <main>
        <p>
          Initial page
        </p>
      </main>
    </>
  )
}

Init.displayName = 'Init'
