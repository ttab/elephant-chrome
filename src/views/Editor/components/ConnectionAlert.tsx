import { Alert, AlertTitle, AlertDescription } from '@ttab/elephant-ui'
import { Unplug } from '@ttab/elephant-ui/icons'

export const ConnectionAlert = (): JSX.Element => (
  <div className='p-4'>
    <Alert variant='destructive'>
      <Unplug size={18} strokeWidth={1.75} />
      <AlertTitle>Du saknar anslutning till servern</AlertTitle>
      <AlertDescription>
        Försöker att återansluta... Under tiden kan du inte redigera dokumentet.
      </AlertDescription>
    </Alert>
  </div>
)
