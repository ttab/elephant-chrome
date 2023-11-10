import { ViewHeader } from '@/components'
import { type ViewProps } from '@/types'

export const Init = (props: ViewProps): JSX.Element => {
  return (
    <>
      <ViewHeader title='Init' { ...props } />
      <main>
        <p>
          Initial page
        </p>
      </main>
    </>
  )
}

Init.displayName = 'Init'
