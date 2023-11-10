import { type ViewProps } from '@/types'
import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useEffect, useState } from 'react'
import { Planning } from '@/lib/planning'
import { useApi } from '@/hooks/useApi'
import { type SearchIndexResponse } from '@/lib/index/search'

export const PlanningOverview = (props: ViewProps): JSX.Element => {
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const [result, setResult] = useState<SearchIndexResponse | undefined>()

  useEffect(() => {
    if (!jwt) {
      return
    }

    const args = {
      size: 30,
      where: {
        startDate: '2023-10-01T00:00:00Z' // FIXME: Convert to non hardcoded when working more on this view
      }
    }

    Planning.search(indexUrl, jwt, args)
      .then(result => {
        setResult(result)
      })
      .catch(ex => {
        console.log(ex)
      })
  }, [indexUrl, jwt])

  return (
    <>
      <ViewHeader title='Planning' {...props} />
      <main>
        <h2 className="text-lg font-bold mb-4">Planning overview content</h2>

        {result?.ok === true &&
          <div className="bg-gray-100">
            <div className="flex flex-col gap-4 p-4 border">
              {result.hits.map(({ _id, _source }) => {
                return <div className="flex flex-col gap-1 bg-white p-3 shadow-md rounded-md" key={_id}>
                  <div className="font-bold">
                    {_source['document.meta.core_assignment.title']}
                  </div>
                  <div className="text-xs opacity-50">
                    {_id}
                  </div>
                  <div className="text-sm">
                    {formatDate(_source['document.meta.core_assignment.data.start'][0])}
                  </div>
                </div>
              })}
            </div>
          </div>
        }

        <pre className="mt-8 p-8 bg-slate-300 whitespace-pre-wrap text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>

      </main>
    </>
  )
}

PlanningOverview.displayName = 'PlanningOverview'

// TODO: Breakout to lib that has awareness of locales etc...
function formatDate(date: Date | string): string {
  const dt = typeof date === 'string' ? new Date(date) : date

  // Format the date in Swedish locale
  return dt.toLocaleDateString(
    'sv-SE',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }
  )
}
