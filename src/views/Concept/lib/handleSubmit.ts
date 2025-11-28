import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'

export const handleSubmit = (
  environmentIsSane: boolean | undefined,
  documentId: string,
  setChanged: (arg0: boolean) => void,
  onDialogClose: ((id?: string, title?: string) => void) | undefined): void => {
  if (environmentIsSane) {
    void snapshotDocument(documentId, { status: 'usable', addToHistory: true }).then((response) => {
      if (response?.statusMessage) {
        toast.error('Kunde inte skapa ny inställning!', {
          duration: 5000,
          position: 'top-center'
        })
        return
      }
      setChanged(false)
      if (onDialogClose) {
        onDialogClose()
      }
    })
  }
}
