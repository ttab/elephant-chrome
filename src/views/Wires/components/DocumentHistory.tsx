import { useRegistry } from '@/hooks/useRegistry'
import type { BulkGetItem, GetHistoryResponse } from '@ttab/elephant-api/repository'
import { useSession } from 'next-auth/react'
import { Fragment, useEffect, useState } from 'react'
import { CircleIcon } from '@ttab/elephant-ui/icons'
import { dateToReadableDateTime } from '@/shared/datetime'
import { cn } from '@ttab/elephant-ui/utils'
import { Tooltip } from '@ttab/elephant-ui'

interface HistoryEntry {
  version: bigint
  created: string
  creator: string
  status: string | null
  type: 'version' | 'status'
}

interface StatusItem {
  id: bigint
  version: bigint
  creator: string
  created: string
  meta?: Record<string, unknown>
}

export const DocumentHistory = ({ uuid, currentVersion }: {
  uuid: string
  currentVersion?: bigint
}) => {
  const { repository, locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [documents, setDocuments] = useState<BulkGetItem[] | null>(null)

  useEffect(() => {
    if (!repository || !session?.accessToken) {
      return
    }

    const c1 = new AbortController()
    const c2 = new AbortController()
    const pending = {
      history: true,
      documents: false
    }

    const fetchData = async () => {
      try {
        // Get history and extract relevant information
        const result = await repository.getHistory({
          accessToken: session.accessToken,
          uuid,
          abort: c1.signal
        })

        pending.history = false

        const history = result?.versions ? extractVersionInfo(result) : null
        if (!history) {
          setHistory(null)
          setDocuments(null)
          return
        }

        // Extract unique versions
        const docVersions = history.reduce((acc, entry) => {
          if (!acc.find((i) => i.version === entry.version)) {
            acc.push({ uuid, version: entry.version })
          }
          return acc
        }, [] as Array<{ uuid: string, version: bigint }>)

        // Get document versions
        pending.documents = true
        const documents = await repository.getDocuments({
          documents: docVersions,
          accessToken: session.accessToken,
          abort: c2.signal
        })

        pending.documents = false

        setHistory(history)
        setDocuments(documents?.items ?? null)
      } catch (error) {
        pending.history = false
        pending.documents = false
        console.error(error)
      }
    }

    void fetchData()

    return () => {
      if (pending.history) c1.abort()
      if (pending.documents) c2.abort()
    }
  }, [uuid, repository, session])


  return (
    <div className='grid grid-cols-[auto_auto_1fr] gap-0 text-sm text-muted-foreground'>
      {history?.map((item, index) => {
        const title = documents?.find((doc) => doc.version === item.version)?.document?.title
        const isCurrent = item.version === currentVersion

        if (index > 4 && history.length > 6) {
          return null
        }

        if (index === 4 && history.length > 6) {
          return (
            <Fragment key={`${item.version}-${item.status}-${index}`}>
              <div className='relative flex items-center justify-center pe-2 h-full'>
                <HistoryIcon status='system' isLast={true} />
              </div>

              <div className='py-0.5 ps-3'></div>

              <div className='py-1 ps-5 items-center truncate text-foreground'>
                Ytterligare äldre versioner finns...
              </div>
            </Fragment>
          )
        }

        return (
          <Fragment
            key={`${item.version}-${item.status}-${index}`}
          >
            <div className='relative flex items-center justify-center pe-2 h-full'>
              <HistoryIcon
                status={item.status || 'draft'}
                isCurrent={isCurrent}
                isLast={index === history.length - 1}
              />
            </div>

            <div className='py-0.5 ps-3 cursor-default'>
              {dateToReadableDateTime(new Date(item.created), locale.code.short, timeZone)}
            </div>


            <div className='py-1 ps-5 items-center truncate cursor-default'>
              <Tooltip content={(
                <div className='flex flex-col gap-2'>
                  <span className='font-semibold'>
                    Version
                    {` `}
                    {item.version}
                  </span>
                  <span>
                    {title}
                  </span>
                </div>
              )}
              >
                {title}
              </Tooltip>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

const HistoryIcon = ({ status, isCurrent, isLast }: {
  status: string
  isCurrent?: boolean
  isLast?: boolean
}) => {
  const colors: Record<string, string> = {
    draft: 'oklch(75.17% 0.0138 285.94)',
    done: 'oklch(91.62% 0.1424 100.94)',
    saved: 'oklch(91.62% 0.1424 100.94)',
    approved: 'oklch(68.25% 0.1005 146.77)',
    read: 'oklch(68.25% 0.1005 146.77)',
    usable: 'oklch(75.53% 0.1157 260.64)',
    used: 'oklch(75.53% 0.1157 260.64)',
    withheld: 'oklch(77.69% 0.1218 206.47)',
    cancelled: 'oklch(63.58% 0.2088 25.41)',
    unpublished: 'oklch(64.8% 0.42 51.56)',
    flash: 'oklch(62.8% 0.257 29.23)',
    system: 'oklch(20% 0.0138 285.94)'
  }
  const color = status ? colors[status] : colors['draft']

  return (
    <>
      <CircleIcon
        fill={color}
        stroke={color}
        className={cn(
          'rounded-full',
          isCurrent ? 'w-3 h-3' : 'w-4 h-4'
        )}
        style={{
          outline: isCurrent ? `2px solid ${color}` : 'none',
          outlineOffset: '3px'
        }}
      />

      {!isLast
        && (
          <div
            className='absolute left-0 top-0 bottom-0 w-0.5'
            style={{
              backgroundColor: color,
              transform: 'translate(calc((var(--spacing) * 2) - 1px), 50%)'
            }}
          />
        )}
    </>
  )
}

function extractVersionInfo(data: GetHistoryResponse): HistoryEntry[] {
  const sortedVersions = [...data.versions].sort((a, b) => {
    if (a.version < b.version) return -1
    if (a.version > b.version) return 1
    return 0
  })

  const entries: HistoryEntry[] = []
  let currentStatus: string | null = null

  sortedVersions.forEach((version) => {
    const statusChanges: Array<{ name: string, item: StatusItem }> = []

    if (version.statuses) {
      for (const [name, statusData] of Object.entries(version.statuses)) {
        if (!statusData?.items || statusData.items.length === 0) continue

        statusData.items.forEach((item) => {
          statusChanges.push({ name, item })
        })
      }
    }

    statusChanges.sort((a, b) => {
      if (a.item.id < b.item.id) return -1
      if (a.item.id > b.item.id) return 1
      return 0
    })

    // If this version has status changes, add each one as an entry
    if (statusChanges.length > 0) {
      statusChanges.forEach(({ name, item }) => {
        currentStatus = name

        entries.push({
          version: version.version,
          created: item.created,
          creator: item.creator,
          status: name,
          type: 'status'
        })
      })
    } else {
      // No status changes in this version, but carry forward the current status
      entries.push({
        version: version.version,
        created: version.created,
        creator: version.creator,
        status: currentStatus,
        type: 'version'
      })
    }
  })

  return entries.reverse()
}
