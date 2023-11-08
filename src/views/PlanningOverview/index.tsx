import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useEffect, useState } from 'react'
import { Planning } from '@/lib/planning'

export const PlanningOverview = (): JSX.Element => {
  const { session } = useSession()
  const [result, setResult] = useState<unknown | undefined>()

  useEffect(() => {
    if (!session?.jwt) {
      return
    }

    Planning.search(session.jwt)
      .then(result => {
        setResult(result)
      })
      .catch(ex => {
        console.log(ex)
      })
  }, [session?.jwt])

  return (
    <>
      <ViewHeader title='Planning' />
      <main>
        <h2>Planning overview content</h2>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </main>
    </>
  )
}

PlanningOverview.displayName = 'PlanningOverview'
