import { snapshotDocument } from '@/lib/snapshotDocument'
import { createDocument } from '@/shared/createYItem'
import type { Repository } from '@/shared/Repository'
import { sectionDocumentTemplate } from '@/shared/templates/sectionDocumentTemplate'
import { toast } from 'sonner'

export const reset = async <T>(repository: Repository, documentId: string, accessToken: string) => {
// Get last usable version id of document

  const usableDocument = await repository.getStatuses({ uuids: [documentId], statuses: ['usable'], accessToken: accessToken })
  const usableVersion = usableDocument?.items[0].heads.usable.version

  const lastUsable = (await repository.getDocuments({
    documents: [{ uuid: documentId, version: usableVersion }],
    accessToken: accessToken
  }))?.items[0].document

  const documentCopy = createDocument({ template: sectionDocumentTemplate, inProgress: false, payload: lastUsable, documentId: documentId })
  void snapshotDocument(documentId, { status: 'usable', addToHistory: true }, documentCopy[1]).then((response) => {
    if (response?.statusMessage) {
      toast.error('Kunde inte återställa dokumentet!', {
        duration: 5000,
        position: 'top-center'
      })
      return
    }
  })
  console.log(lastUsable)
  console.log(documentCopy)
}

// Make a copy
// Save copy as new document
/* const usableCopy = createDocument({ template: sectionDocumentTemplate, inProgress: false,  }) */
