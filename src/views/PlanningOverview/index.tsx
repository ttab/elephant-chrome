import { type ViewMetadata, type ViewProps } from '@/types'
import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useEffect, useState } from 'react'
import { Planning } from '@/lib/planning'
import { useApi } from '@/hooks/useApi'
import { type SearchIndexResponse } from '@/lib/index/search'

import { PlanningTable } from '@/components/PlanningTable'
import { columns } from '@/components/PlanningTable/Columns'

const meta: ViewMetadata = {
  name: 'PlanningOverview',
  path: '/',
  widths: {
    sm: [100],
    md: [100],
    lg: [50, 100],
    xl: [50, 100],
    '2xl': [40, 80]
  }
}

export const PlanningOverview = (props: ViewProps): JSX.Element => {
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const [result, setResult] = useState<SearchIndexResponse | undefined>()

  useEffect(() => {
    if (!jwt) {
      return
    }

    const args = {
      size: 500,
      where: {
        startDate: '2023-11-09T00:00:00Z' // FIXME: Convert to non hardcoded when working more on this view
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
      <ViewHeader title='Plannings 2023-11-09' {...props} />
      <main className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        {result?.ok === true &&
          <PlanningTable data={result?.hits} columns={columns} />
        }
      </main>
    </>
  )
}

PlanningOverview.meta = meta
