import { useNavigation } from '@/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { useIndexedDB } from './datastore/hooks/useIndexedDB'

export const AppContent = (): JSX.Element => {
  const { state } = useNavigation()
  const IDB = useIndexedDB()

  return (
    <>
      {state.content}

      <Dialog open={!IDB.db}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Du behöver ladda om fönstret</DialogTitle>
            <DialogDescription>
              Systemet har uppdaterats med nya eller ändrade funktioner.
              Ladda om fönstret för att jobba vidare i den nya versionen.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </>
  )
}
