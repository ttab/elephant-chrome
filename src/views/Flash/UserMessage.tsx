import { EleBlock } from '@/shared/types'
import { DefaultValueOption } from '@/types/index'
import { Alert, AlertDescription } from '@ttab/elephant-ui'
import { InfoIcon, ShieldAlert } from '@ttab/elephant-ui/icons'

type Props = {
  author?: EleBlock | null
  selectedPlanning?: DefaultValueOption
}

export const UserMessage = ({ author, selectedPlanning }: Props) => {
  if (author) {
    return (
      <Alert className='bg-gray-50' variant='default'>
        <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
        <AlertDescription>
          {!selectedPlanning
            ? (
                <>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>
              )
            : (
                <>Denna flash kommer läggas i ett nytt uppdrag i den valda planeringen</>
              )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className='bg-gray-50' variant='destructive'>
      <ShieldAlert size={18} strokeWidth={1.75} className='text-muted-foreground' />
      <AlertDescription>
        <>Hittade inget författardokument. Flash kan inte skickas.</>
      </AlertDescription>
    </Alert>
  )
}
