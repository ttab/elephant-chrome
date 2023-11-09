import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useEffect, useState } from 'react'
import { Planning } from '@/lib/planning'
import { useApi } from '@/hooks/useApi'

export const PlanningOverview = (): JSX.Element => {
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const [result, setResult] = useState<unknown | undefined>()

  useEffect(() => {
    if (!jwt) {
      return
    }

    Planning.search(indexUrl, jwt)
      .then(result => {
        setResult(result)
      })
      .catch(ex => {
        console.log(ex)
      })
  }, [indexUrl, jwt])

  return (
    <>
      <ViewHeader title='Planning' />
      <main>
        <h2>Planning overview content</h2>
        <pre className="pre-wrap text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </main>
    </>
  )
}

PlanningOverview.displayName = 'PlanningOverview'
