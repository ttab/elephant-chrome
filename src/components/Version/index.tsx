import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks/useRegistry'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useModal } from '../Modal/useModal'
import { PreviewSheet } from '@/views/Wires/components'
import { useAuthors } from '@/hooks/useAuthors'
import { getCreatorBySub } from './getCreatorBySub'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { Error } from '@/views/Error'
import { STATUS_KEYS } from './statuskeys'
import type { GetHistoryResponse } from '@ttab/elephant-api/repository'
import type { DocumentVersion } from '@ttab/elephant-api/repository'
import type { EleDocumentResponse } from '@/shared/types'
import { dateToReadableDateTime } from '@/lib/datetime'
const BASE_URL = import.meta.env.BASE_URL || ''

type Status = { name: string, created: string, creator: string }

type SelectedVersion = Pick<DocumentVersion, 'created' | 'version' | 'creator'> & {
  createdBy?: string
  lastStatus?: Status
  title?: string
}

export const Version = ({ documentId, hideDetails = false, textOnly = true }: { documentId: string, hideDetails?: boolean, textOnly?: boolean }) => {
  const { repository, locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const authors = useAuthors()
  const [lastUpdated, setLastUpdated] = useState('')

  const { data: versionHistory, error } = useSWR<DocumentVersion[], Error>(`version/${documentId}`, async (): Promise<Array<DocumentVersion & { title?: string, slugline?: string }>> => {
    if (!session?.accessToken || !repository) {
      return []
    }

    const result: GetHistoryResponse | null = await repository.getHistory({ accessToken: session.accessToken, uuid: documentId })

    if (result === null) {
      return []
    }

    if (!result?.versions.length) {
      return []
    }

    // Setting time for when last version was created
    setLastUpdated(result.versions[0].created)

    // We're only interested in versions with set statuses
    result.versions = result.versions.filter((v) => {
      const statuskeys = Object.keys(v.statuses)
      if (!statuskeys.length) {
        return v
      }
      return statuskeys.some((key) => STATUS_KEYS.includes(key))
    })

    const fetchDoc = async (v: DocumentVersion) => {
      // Used to fetch the previous document version in order to get hold of the title,
      // that can be displayed in the list of previous versions.
      const response = await fetch(`${BASE_URL}/api/documents/${documentId}?version=${v.version}`)
      return await response.json()
    }

    result.versions = await Promise.all(result.versions.map(async (version) => {
      const versionDoc = await fetchDoc(version) as EleDocumentResponse

      if (versionDoc) {
        const doc = versionDoc?.document
        let docTitle = ''
        let headingTitle = ''

        if (doc?.title) {
          docTitle = doc.title
        }

        const slugline = doc?.meta?.['tt/slugline']?.[0]?.value ?? ''

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
          slugline
        }
      }
      return version
    }))

    const getLastReadOrSaved = (version: DocumentVersion) => {
      if (version?.creator.includes('elephant-wires')) {
        return Object.entries(version.statuses).map((s) => {
          const [name, data] = s
          const lastCreated = data.items.sort((a, b) => a.created > b.created ? -1 : 1)[0]
          const creator = lastCreated.creator
          const created = lastCreated.created
          return { name, created, creator }
        })?.sort((a, b) => a.created > b.created ? -1 : 1)[0]
      }
    }

    // Set last version as starting point
    const lastStatus = getLastReadOrSaved(result?.versions[0])

    const createdBy = getCreatorBySub({
      authors,
      creator: lastStatus?.creator || result?.versions[0]?.creator
    })?.name || '???'

    setVersion({
      ...result?.versions[0],
      createdBy,
      lastStatus
    })
    return result?.versions
  })

  const [selectedVersion, setVersion] = useState<SelectedVersion>()
  const { showModal, hideModal } = useModal()

  const createdBy = useCallback((creator: string) => getCreatorBySub({ authors, creator })?.name || '???', [authors])

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

    const getUsable = (version: DocumentVersion): Status | undefined => {
      let status: Status = { name: '', created: '', creator: '' }

      const statuses = [
        ...DocumentStatuses,
        {
          label: 'Läst',
          value: 'read'
        },
        {
          label: 'Sparad',
          value: 'saved'
        },
        {
          label: 'Använd',
          value: 'used'
        }
      ]

      if (!Object.keys(version?.statuses)?.length) {
        return { ...status, creator: createdBy(version.creator), created: version.created }
      }

      for (const key in version?.statuses) {
        if (STATUS_KEYS.includes(key)) {
          const item = version.statuses[key]?.items[0]
          const name = statuses.find((s) => s.value === key)?.label || ''

          status = { name, created: version.created, creator: createdBy(item.creator) || createdBy(version.creator) }
        }
      }
      return status
    }

    return versionHistory?.map((v: DocumentVersion & { title?: string, slugline?: string }) => {
      const usable = getUsable(v)
      return (
        <SelectItem
          key={`${usable?.created}-${v.version}`}
          value={v.version.toString()}
        >
          <div className='flex flex-col gap-1'>
            <span className='hidden sm:block font-bold'>{`${v?.title}`}</span>
            <div className='m-0'>
              <span className='text-muted-foreground'>{`${v?.slugline}`}</span>
              <div className='flex items-center gap-2'>
                {usable?.created && <span>{`${formatDateAndTime(usable.created)}`}</span>}
                <span>{`${usable?.name} av ${usable?.creator || '???'}`}</span>
              </div>
            </div>
          </div>
        </SelectItem>
      )
    })
  }, [documentId, versionHistory, createdBy, formatDateAndTime])

  if (!versionHistory?.length) {
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
          const current = versionHistory?.find((v) => v.version === BigInt(option))
          setVersion(current)
          showModal(
            <PreviewSheet
              id={documentId}
              version={current?.version && BigInt(current?.version)}
              versionHistory={versionHistory}
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

        <SelectContent>
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
