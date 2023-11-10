import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useEffect, useState } from 'react'
import { Planning } from '@/lib/planning'
import { useApi } from '@/hooks/useApi'
import { type SearchIndexResponse } from '@/lib/index/search'

export const PlanningOverview = (): JSX.Element => {
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const [result, setResult] = useState<SearchIndexResponse | undefined>()

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
        <h2 className="text-lg font-bold mb-4">Planning overview content</h2>

        {result?.ok === true &&
          <div className="bg-gray-100">
            <div className="flex flex-col gap-4 p-4 border">
              {result.hits.map(hit => {
                return <div className="flex flex-col gap-1 bg-white p-3 shadow-md rounded-md" key={hit._id}>
                  <div className="font-bold">
                    {hit._source['document.meta.core_assignment.title']}
                  </div>
                  <div className="text-xs opacity-50">
                    {hit._id}
                  </div>
                </div>
              })}
            </div>
          </div>
        }

        <pre className="mt-8 p-8 bg-slate-300 whitespace-pre-wrap text-xs">
          {JSON.stringify(result?.hits, null, 2)}
        </pre>

      </main>
    </>
  )
}

PlanningOverview.displayName = 'PlanningOverview'
