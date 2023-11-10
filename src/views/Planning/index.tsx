import { ViewHeader } from '@/components'
import { type ViewProps } from '@/types'

export const Planning = (props: ViewProps): JSX.Element => {
  return (
    <>
      <ViewHeader title='Planning' { ...props} />
      <main>
        <p>
          Planning overview content
        </p>
      </main>
    </>
  )
}

Planning.displayName = 'Planning'
