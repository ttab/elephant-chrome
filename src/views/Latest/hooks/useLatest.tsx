import { useDocuments } from '@/hooks/index/useDocuments'
import { useEffect, useMemo, useState } from 'react'
import type { HitV1 } from '@ttab/elephant-api/index'
import { QueryV1, RangeQueryV1, SortingV1 } from '@ttab/elephant-api/index'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRegistry } from '@/hooks/useRegistry'

export const useLatest = (): HitV1[] => {
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [versionedData, setVersionedData] = useState<HitV1[]>([])

  const { data: dataArticles } = useDocuments({
    documentType: 'core/article',
    fields: [
      'document.title',
      'document.uri',
      'heads.usable.created',
      'heads.usable.version',
      'document.meta.tt_slugline.value',
      'document.rel.section.title'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'heads.usable.created',
          gte: 'now-24h'
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'heads.usable.created', desc: true })
    ]
  })

  const { data: dataFlashes } = useDocuments({
    documentType: 'core/flash',
    fields: [
      'document.title',
      'document.uri',
      'heads.usable.created',
      'heads.usable.version',
      'document.rel.section.title'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'heads.usable.created',
          gte: 'now-24h'
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'heads.usable.created', desc: true })
    ]
  })

  const { data: dataEditorialInfo } = useDocuments({
    documentType: 'core/editorial-info',
    fields: [
      'document.title',
      'document.uri',
      'heads.usable.created',
      'heads.usable.version',
      'document.meta.tt_slugline.value',
      'document.rel.section.title'
    ],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'heads.usable.created',
          gte: 'now-24h'
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'heads.usable.created', desc: true })
    ]
  })

  const data = useMemo(
    () =>
      [
        ...(dataArticles ?? []),
        ...(dataFlashes ?? []),
        ...(dataEditorialInfo ?? [])
      ].sort((a, b) => {
        const aCreated = a.fields['heads.usable.created']?.values?.[0]
        const bCreated = b.fields['heads.usable.created']?.values?.[0]
        return (bCreated ?? '').localeCompare(aCreated ?? '')
      }),
    [dataArticles, dataFlashes, dataEditorialInfo]
  )

  // Append search result with the title of the usable version
  useEffect(() => {
    if (!data || !session?.accessToken) return

    const fetchDocuments = async () => {
      try {
        const repositoryDocuments = await repository?.getDocuments({
          documents: data.map(({ id, fields }: HitV1) => ({
            uuid: id,
            version: fields['heads.usable.version']?.values[0]
              ? BigInt(fields['heads.usable.version'].values[0])
              : undefined
          })),
          accessToken: session.accessToken
        })

        setVersionedData(
          data.map((item) => {
            const repoDoc = repositoryDocuments?.items.find(
              (doc) => doc.document?.uuid === item.id
            )

            return {
              ...item,
              fields: {
                ...item.fields,
                'document.title': {
                  values: [repoDoc?.document?.title || item.fields['document.title']?.values[0]]
                }
              }
            }
          })
        )
      } catch (error) {
        console.error(error)
        toast.error('Kunde inte hämta dokument')
      }
    }

    void fetchDocuments()
  }, [data, repository, session?.accessToken])

  return versionedData
}
