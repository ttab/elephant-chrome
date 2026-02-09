import type { Dispatch, SetStateAction } from 'react'
import type {
  DocumentState,
  DocumentUpdate,
  DocumentRemoved,
  InclusionBatch
} from '@ttab/elephant-api/repositorysocket'
import type { DocumentStateWithDecorators, Decorator } from '../types'

export const findDeliverableParentIndex = <TDecoratorData = unknown>(
  documents: DocumentStateWithDecorators<TDecoratorData>[],
  targetUuid?: string
) => {
  if (!targetUuid) {
    return -1
  }

  return documents.findIndex((doc) => {
    const metas = doc.document?.meta?.filter((m) => m.type === 'core/assignment')
    if (!metas?.length) {
      return false
    }

    for (const meta of metas) {
      for (const link of meta.links ?? []) {
        if (link.rel === 'deliverable' && link.uuid === targetUuid) {
          return true
        }
      }
    }

    return false
  })
}

export const upsertIncludedDocument = <TDecoratorData = unknown>(
  parent: DocumentStateWithDecorators<TDecoratorData>,
  includedDoc: { uuid: string, state?: DocumentState | DocumentUpdate }
) => {
  if (!parent.includedDocuments) {
    parent.includedDocuments = []
  }

  const includedUuid = includedDoc.state?.document?.uuid ?? includedDoc.uuid
  const entry = {
    uuid: includedUuid,
    state: includedDoc.state,
    __updater: {
      sub: includedDoc.state?.meta?.updaterUri || '??',
      time: includedDoc.state?.meta?.modified || Date.now().toString()
    }
  }

  const existingIndex = parent.includedDocuments.findIndex(
    (doc) => doc.state?.document?.uuid === includedUuid || doc.uuid === includedUuid
  )

  if (existingIndex >= 0) {
    parent.includedDocuments[existingIndex] = entry
  } else {
    parent.includedDocuments.push(entry)
  }
}

export const isDocumentRemoved = (
  update: DocumentUpdate | DocumentRemoved | InclusionBatch
): update is DocumentRemoved => {
  return 'documentUuid' in update
}

export const isInclusionBatch = (
  update: DocumentUpdate | DocumentRemoved | InclusionBatch
): update is InclusionBatch => {
  return 'documents' in update
}

export const isDocumentUpdate = (
  update: DocumentUpdate | DocumentRemoved | InclusionBatch
): update is DocumentUpdate => {
  return 'included' in update || 'document' in update
}

export const isInclusionUpdate = (
  update: DocumentUpdate | DocumentRemoved | InclusionBatch
): update is DocumentUpdate => {
  return isDocumentUpdate(update) && update.included === true
}

export const handleRemoved = <TEnrichment = unknown>(
  prevData: DocumentStateWithDecorators<TEnrichment>[],
  update: DocumentRemoved
) => {
  const newData = prevData.filter((p) => p.document?.uuid !== update.documentUuid)

  return newData
}

export const handleInclusionBatchUpdate = <TEnrichment = unknown>(
  prevData: DocumentStateWithDecorators<TEnrichment>[],
  update: InclusionBatch
) => {
  const newData = [...prevData]
  let changed = false

  for (const includedDocument of update.documents ?? []) {
    const targetUuid = includedDocument.state?.document?.uuid ?? includedDocument.uuid
    const parentIndex = findDeliverableParentIndex(newData, targetUuid)

    if (parentIndex >= 0) {
      const parent = { ...newData[parentIndex], includedDocuments: [...(newData[parentIndex].includedDocuments ?? [])] }
      newData[parentIndex] = parent
      upsertIncludedDocument(parent, {
        uuid: includedDocument.uuid,
        state: includedDocument.state
      })

      changed = true
    }
  }

  if (changed) {
    return newData
  }

  return prevData
}

export const handleDocumentUpdate = <TEnrichment = unknown>(
  prevData: DocumentStateWithDecorators<TEnrichment>[],
  update: DocumentUpdate,
  scheduleDecoratorUpdate: ScheduleDecoratorUpdate<TEnrichment>
) => {
  // Handle included document update
  if (isInclusionUpdate(update) && update.document) {
    const parentIndex = findDeliverableParentIndex(prevData, update.document.uuid)


    if (parentIndex >= 0) {
      const newData = [...prevData]
      const parent = newData[parentIndex]

      // Update corresponding included document in parent
      upsertIncludedDocument(parent, { uuid: update.document.uuid, state: update })

      // Schedule decorator update for this included document
      void scheduleDecoratorUpdate?.execute(update, parent)

      return newData
    }

    return prevData
  }

  // Handle main document update
  if (update.document) {
    const existingIndex = prevData.findIndex((p) => p.document?.uuid === update.document?.uuid)

    if (existingIndex >= 0) {
      const newData = [...prevData]
      newData[existingIndex] = {
        ...update,
        includedDocuments: newData[existingIndex].includedDocuments,
        decoratorData: newData[existingIndex].decoratorData,
        __updater: {
          sub: update.meta?.updaterUri || '??',
          time: update.meta?.modified || Date.now().toString()
        }
      }
      void scheduleDecoratorUpdate?.execute(update, prevData[existingIndex])
      return newData
    } else if (update.meta) {
      const newData = [
        {
          ...update,
          includedDocuments: undefined,
          __updater: {
            sub: update.meta.updaterUri || '??',
            time: update.meta.modified || Date.now().toString()
          }
        },
        ...prevData
      ]

      void scheduleDecoratorUpdate?.execute(update, update)
      return newData
    }
  }

  return prevData
}

export class ScheduleDecoratorUpdate<TEnrichment = unknown> {
  constructor(
    private setData: Dispatch<SetStateAction<DocumentStateWithDecorators<TEnrichment>[]>>,
    private decoratorsRef: React.RefObject<Decorator<TEnrichment>[]>,
    private runUpdateDecorators: (
      parent: DocumentStateWithDecorators<TEnrichment>,
      update: DocumentUpdate,
      decorators: Decorator<TEnrichment>[]
    ) => Promise<DocumentStateWithDecorators<TEnrichment>>
  ) {}

  async execute(update: DocumentUpdate, parent: DocumentStateWithDecorators<TEnrichment> | null = null) {
    const uuid = update.document?.uuid

    if (!uuid || !parent) {
      return
    }


    try {
      const enrichedDoc = await this.runUpdateDecorators(
        parent,
        update,
        this.decoratorsRef.current
      )

      this.setData((prev) => {
        return prev.map((doc) => {
          if (doc.document?.uuid === parent.document?.uuid) {
            return enrichedDoc
          }
          return doc
        })
      })
    } catch (err) {
      console.warn('Update decorator failed:', err)
    }
  }
}
