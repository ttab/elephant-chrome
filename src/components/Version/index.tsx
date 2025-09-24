import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks/useRegistry'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useModal } from '../Modal/useModal'
import { PreviewSheet } from '@/views/Wires/components'
import { useAuthors } from '@/hooks/useAuthors'
import { Error } from '@/views/Error'
import type { GetStatusHistoryReponse } from '@ttab/elephant-api/repository'
import type { Status as DocumentStatus } from '@ttab/elephant-api/repository'
import type { EleDocumentResponse } from '@/shared/types'
import { dateToReadableDateTime } from '@/shared/datetime'
import { CAUSE_KEYS } from '../../defaults/causekeys'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { getAuthorBySub } from '@/lib/getAuthorBySub'
const BASE_URL = import.meta.env.BASE_URL || ''

type Status = { name: string, created: string, creator: string }

type SelectedVersion = Pick<DocumentStatus, 'created' | 'version' | 'creator'> & {
  createdBy?: string
  lastStatus?: Status
  title?: string
}

export const Version = ({ documentId, hideDetails = false, textOnly = true }: { documentId: string, hideDetails?: boolean, textOnly?: boolean }) => {
  const { repository, locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const authors = useAuthors()
  const [lastUpdated, setLastUpdated] = useState('')

  const { data: versionStatusHistory, error } = useSWR<DocumentStatus[], Error>(`version/${documentId}`, async (): Promise<Array<DocumentStatus & {
    bylines?: Block[]
    title?: string
    slugline?: string
  }>> => {
    if (!session?.accessToken || !repository) {
      return []
    }

    const result: GetStatusHistoryReponse | null = await repository.getStatusHistory({ accessToken: session.accessToken, uuid: documentId })

    if (result === null) {
      return []
    }

    if (!result?.statuses.length) {
      return []
    }
    // Setting time for when last version was created
    setLastUpdated(result.statuses[0].created)

    const fetchDoc = async (v: DocumentStatus) => {
      // Used to fetch the previous document version in order to get hold of the title,
      // that can be displayed in the list of previous versions.
      const response = await fetch(`${BASE_URL}/api/documents/${documentId}?version=${v.version}`)
      return await response.json() as EleDocumentResponse
    }

    result.statuses = await Promise.all(result.statuses.map(async (version) => {
      const versionDoc = await fetchDoc(version)

      if (versionDoc) {
        const doc = versionDoc?.document
        let docTitle = ''
        let headingTitle = ''

        if (doc?.title) {
          docTitle = doc.title
        }

        const slugline = doc?.meta?.['tt/slugline']?.[0]?.value ?? ''
        const bylines = doc?.links?.['core/author'] ?? []

        if (doc?.content.length) {
          // If we're dealing with an article or a wire, the title can be found
          // in the heading-1 role, in case the document title is empty
          const heading = doc?.content?.find((c) => c?.properties?.role === 'heading-1')?.children[0]
          if (heading && 'text' in heading) {
            headingTitle = heading?.text
          }
        }

        return {
          ...version,
          title: docTitle || headingTitle,
          slugline,
          bylines
        }
      }
      return version
    }))

    // Set last version as starting point
    const lastStatus = { ...result?.statuses[0], name: 'usable' }
    const createdBy = getAuthorBySub(
      authors,
      lastStatus?.creator || result?.statuses[0]?.creator
    )?.name || '???'

    setVersion({
      ...result?.statuses[0],
      createdBy,
      lastStatus
    })
    return result?.statuses
  })

  const [selectedVersion, setVersion] = useState<SelectedVersion>()
  const { showModal, hideModal } = useModal()

  const createdBy = useCallback((creator: string) => getAuthorBySub(authors, creator)?.name || '???', [authors])

  const formatDateAndTime = useCallback((date: string) => {
    if (date) {
      const sameYear = new Date(date).getFullYear() === new Date().getFullYear()
      return dateToReadableDateTime(new Date(date), locale.code.full, timeZone, !sameYear)
    }
    return ''
  }, [locale.code.full, timeZone])

  const VersionStack = useMemo(() => {
    if (!documentId) {
      return <></>
    }

    const getUsable = (v: DocumentStatus): Status | undefined => {
      const status: Status = { name: '', created: v.created, creator: createdBy(v.creator) }

      if (v.meta && 'cause' in v.meta) {
        if ((CAUSE_KEYS as Record<string, { short: string, long: string }>)[v?.meta?.cause]) {
          status.name = (CAUSE_KEYS as Record<string, { short: string, long: string }>)[v?.meta?.cause]?.short
        }
      }

      if (v.version === -1n) {
        status.name = 'Avpublicerad'
      }

      return status
    }

    return versionStatusHistory?.map((v: DocumentStatus & { bylines?: Block[], title?: string, slugline?: string }) => {
      const usable = getUsable(v)
      const bylineNames = v.bylines?.map((block) => block.title) || []
      const versionNumber = v.id

      return (
        <SelectItem
          key={`${usable?.created}-${v.version}`}
          value={v.version.toString()}
        >
          <div className='flex flex-col gap-1'>
            <span className='hidden sm:block font-bold'>{`${v?.title}`}</span>
            <div className='m-0 flex items-center gap-1 text-muted-foreground'>
              {v.slugline && <span>{`${v?.slugline}`}</span>}
              <span>{`- v${versionNumber}`}</span>
              {usable?.name && <span>{`- ${usable?.name}`}</span>}
            </div>
            <div className='flex flex-col gap-1'>
              <div>
                {bylineNames?.length > 0
                  ? <span>{bylineNames.join(', ')}</span>
                  : <span>{usable?.creator || '???'}</span>}
              </div>
              {usable?.created && <span className='italic'>{`${formatDateAndTime(usable.created)}`}</span>}
            </div>
          </div>
        </SelectItem>
      )
    })
  }, [documentId, versionStatusHistory, createdBy, formatDateAndTime])

  if (!versionStatusHistory?.length) {
    return <></>
  }

  if (error) {
    console.error('Error fetching version history', error)
    return (
      <Error
        title='Fel'
        message='Det uppstod ett fel när dokumenthistoriken hämtades.'
      />
    )
  }

  return (
    <div className='flex flex-col gap-2 rounded -mt-2'>
      <Select
        onValueChange={(option) => {
          const current = versionStatusHistory?.find((v) => v.version === BigInt(option))
          setVersion(current)
          showModal(
            <PreviewSheet
              id={documentId}
              version={current?.version && BigInt(current?.version)}
              versionStatusHistory={versionStatusHistory}
              textOnly={textOnly}
              handleClose={hideModal}
            />,
            'sheet',
            {
              id: documentId
            })
        }}
      >
        <SelectTrigger className='w-full py-1'>
          {selectedVersion && (
            <>{`${formatDateAndTime(selectedVersion.created)}`}</>
          )}
        </SelectTrigger>

        <SelectContent className='max-h-[400px] overflow-y-auto'>
          {VersionStack}
        </SelectContent>
      </Select>

      {lastUpdated && <div className='text-sm text-muted-foreground pl-0.5'>{`Senast uppdaterad: ${formatDateAndTime(lastUpdated)}`}</div>}

      {!hideDetails && selectedVersion?.createdBy && (
        <div className='text-sm text-muted-foreground pl-0.5'>{`Skapad av ${selectedVersion?.createdBy}`}</div>
      )}
    </div>
  )
}
