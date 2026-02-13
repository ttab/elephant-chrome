import { useRegistry } from '@/hooks/useRegistry'
import type { BulkGetItem, GetHistoryResponse } from '@ttab/elephant-api/repository'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { dateToReadableDateTime } from '@/shared/datetime'
import { HistoryEntry } from './HistoryEntry'

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

export const DocumentHistory = ({ uuid, currentVersion, stickyStatus = true, onSelectVersion, selectedVersion }: {
  uuid: string
  currentVersion?: bigint
  stickyStatus?: boolean
  onSelectVersion: (version: bigint) => void
  selectedVersion: bigint | undefined
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

        const history = result?.versions ? extractVersionInfo(result, stickyStatus) : null
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
  }, [uuid, repository, session, stickyStatus])

  console.log(selectedVersion)
  let previousVersion = 0n
  return (
    <div className='grid grid-cols-[auto_auto_1fr] gap-0 text-sm text-muted-foreground'>
      {history?.length
        && (
          <>
            {[...history].reverse().map((item, index) => {
              const title = (previousVersion !== item.version)
                ? documents?.find((doc) => doc.version === item.version)?.document?.title
                : null
              const isCurrent = item.version === currentVersion && previousVersion !== item.version

              previousVersion = item.version

              return (
                <HistoryEntry
                  key={`${item.version}-${item.status}-${index}`}
                  version={item.version}
                  status={item.status}
                  title={title}
                  isLast={index === history.length - 1}
                  isCurrent={isCurrent}
                  time={dateToReadableDateTime(new Date(item.created), locale.code.short, timeZone)}
                  onSelect={onSelectVersion}
                  selected={selectedVersion === item.version || (!selectedVersion && isCurrent)}
                />
              )
            }).reverse()}
          </>
        )}
    </div>
  )
}

function extractVersionInfo(data: GetHistoryResponse, stickyStatus: boolean = true): HistoryEntry[] {
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
        status: stickyStatus ? currentStatus : null,
        type: 'version'
      })
    }
  })

  return entries.reverse()
}
