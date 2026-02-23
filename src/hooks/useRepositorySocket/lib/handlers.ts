import type { Dispatch, SetStateAction } from 'react'
import type {
  DocumentState,
  DocumentUpdate,
  DocumentRemoved,
  InclusionBatch
} from '@ttab/elephant-api/repositorysocket'
import type { DocumentStateWithDecorators, Decorator } from '../types'
import { getAssignments } from '@/lib/documentHelpers'

export const findDeliverableParentIndex = <TDecoratorData extends object = object>(
  documents: DocumentStateWithDecorators<TDecoratorData>[],
  targetUuid?: string
) => {
  if (!targetUuid) {
    return -1
  }

  return documents.findIndex((doc) => {
    const assignments = getAssignments(doc.document)
    if (!assignments.length) {
      return false
    }

    for (const assignment of assignments) {
      for (const link of assignment.links ?? []) {
        if (link.rel === 'deliverable' && link.uuid === targetUuid) {
          return true
        }
      }
    }

    return false
  })
}

export const upsertIncludedDocument = (
  existingDocuments: NonNullable<DocumentStateWithDecorators['includedDocuments']>,
  includedDoc: { uuid: string, state?: DocumentState | DocumentUpdate }
): NonNullable<DocumentStateWithDecorators['includedDocuments']> => {
  const includedUuid = includedDoc.state?.document?.uuid ?? includedDoc.uuid
  const entry = {
    uuid: includedUuid,
    state: includedDoc.state,
    __updater: {
      sub: includedDoc.state?.meta?.updaterUri || '??',
      time: includedDoc.state?.meta?.modified || new Date().toISOString()
    }
  }

  const existingIndex = existingDocuments.findIndex(
    (doc) => doc.state?.document?.uuid === includedUuid || doc.uuid === includedUuid
  )

  if (existingIndex >= 0) {
    return existingDocuments.map((doc, i) => i === existingIndex ? entry : doc)
  }

  return [...existingDocuments, entry]
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

export const handleRemoved = <TDecoratorData extends object = object>(
  prevData: DocumentStateWithDecorators<TDecoratorData>[],
  update: DocumentRemoved
) => {
  const index = prevData.findIndex((p) => p.document?.uuid === update.documentUuid)
  if (index === -1) {
    return prevData
  }

  return prevData.filter((_, i) => i !== index)
}

export const handleInclusionBatchUpdate = <TDecoratorData extends object = object>(
  prevData: DocumentStateWithDecorators<TDecoratorData>[],
  update: InclusionBatch
) => {
  const newData = [...prevData]
  let changed = false

  for (const includedDocument of update.documents ?? []) {
    const targetUuid = includedDocument.state?.document?.uuid ?? includedDocument.uuid
    const parentIndex = findDeliverableParentIndex(newData, targetUuid)

    if (parentIndex >= 0) {
      newData[parentIndex] = {
        ...newData[parentIndex],
        includedDocuments: upsertIncludedDocument(
          newData[parentIndex].includedDocuments ?? [],
          { uuid: includedDocument.uuid, state: includedDocument.state }
        )
      }

      changed = true
    }
  }

  if (changed) {
    return newData
  }

  return prevData
}

export const handleDocumentUpdate = <TDecoratorData extends object = object>(
  prevData: DocumentStateWithDecorators<TDecoratorData>[],
  update: DocumentUpdate,
  scheduleDecoratorUpdate?: ScheduleDecoratorUpdate<TDecoratorData>
) => {
  // Handle included document update
  if (isInclusionUpdate(update) && update.document) {
    const parentIndex = findDeliverableParentIndex(prevData, update.document.uuid)

    if (parentIndex >= 0) {
      const newData = [...prevData]
      const parent = {
        ...newData[parentIndex],
        includedDocuments: upsertIncludedDocument(
          newData[parentIndex].includedDocuments ?? [],
          { uuid: update.document.uuid, state: update }
        )
      }
      newData[parentIndex] = parent

      // Schedule decorator update for this included document
      void scheduleDecoratorUpdate?.execute(update, parent)

      return newData
    }

    return prevData
  }

  // Handle main document update — extract only DocumentState fields
  if (update.document) {
    const existingIndex = prevData.findIndex((p) => p.document?.uuid === update.document?.uuid)

    if (existingIndex >= 0) {
      const newData = [...prevData]
      newData[existingIndex] = {
        document: update.document,
        meta: update.meta,
        includedDocuments: newData[existingIndex].includedDocuments,
        decoratorData: newData[existingIndex].decoratorData,
        __updater: {
          sub: update.meta?.updaterUri || '??',
          time: update.meta?.modified || new Date().toISOString()
        }
      }
      void scheduleDecoratorUpdate?.execute(update, newData[existingIndex])
      return newData
    } else if (update.meta) {
      const newDoc: DocumentStateWithDecorators<TDecoratorData> = {
        document: update.document,
        meta: update.meta,
        __updater: {
          sub: update.meta.updaterUri || '??',
          time: update.meta.modified || new Date().toISOString()
        }
      }
      const newData = [newDoc, ...prevData]

      void scheduleDecoratorUpdate?.execute(update, newDoc)
      return newData
    }
  }

  return prevData
}

export class ScheduleDecoratorUpdate<TDecoratorData extends object = object> {
  #pending = new Map<string, ReturnType<typeof setTimeout>>()
  #sequence = new Map<string, number>()

  constructor(
    private setData: Dispatch<SetStateAction<DocumentStateWithDecorators<TDecoratorData>[]>>,
    private dataRef: { readonly current: DocumentStateWithDecorators<TDecoratorData>[] },
    private decoratorsRef: React.RefObject<Decorator<Partial<TDecoratorData>>[]>,
    private accessTokenRef: React.RefObject<string>,
    private runUpdateDecorators: (
      parent: DocumentStateWithDecorators<TDecoratorData>,
      update: DocumentUpdate,
      decorators: Decorator<Partial<TDecoratorData>>[],
      accessToken: string
    ) => Promise<DocumentStateWithDecorators<TDecoratorData>>,
    private debounceMs = 300
  ) {}

  execute(update: DocumentUpdate, parent: DocumentStateWithDecorators<TDecoratorData> | null = null) {
    const uuid = update.document?.uuid

    if (!uuid || !parent) {
      return
    }

    const existing = this.#pending.get(uuid)
    if (existing) {
      clearTimeout(existing)
    }

    const seq = (this.#sequence.get(uuid) ?? 0) + 1
    this.#sequence.set(uuid, seq)

    const timer = setTimeout(() => {
      this.#pending.delete(uuid)
      void this.#run(uuid, update, seq)
    }, this.debounceMs)

    this.#pending.set(uuid, timer)
  }

  async #run(uuid: string, update: DocumentUpdate, seq: number) {
    try {
      const currentParent = this.dataRef.current.find(
        (doc) => doc.document?.uuid === uuid
      ) ?? null

      if (!currentParent) {
        return
      }

      const accessToken = this.accessTokenRef.current
      if (!accessToken) return

      const enrichedDoc = await this.runUpdateDecorators(
        currentParent,
        update,
        this.decoratorsRef.current,
        accessToken
      )

      if (this.#sequence.get(uuid) !== seq) {
        return
      }

      this.setData((prev) => {
        return prev.map((doc) => {
          if (doc.document?.uuid === uuid) {
            return enrichedDoc
          }
          return doc
        })
      })
    } catch (err) {
      console.warn('Update decorator failed:', err)
    }
  }

  cleanup() {
    for (const timer of this.#pending.values()) {
      clearTimeout(timer)
    }
    this.#pending.clear()
  }
}
