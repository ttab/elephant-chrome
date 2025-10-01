import { Badge, Button } from '@ttab/elephant-ui'

export const SluglineButton = ({ value, setActive }: {
  value?: string
  setActive?: ((value: boolean) => void) | null
}): JSX.Element => {
  return (!setActive)
    ? (
        <Badge
          variant='outline'
          className='bg-background rounded-md text-muted-foreground font-normal text-sm whitespace-nowrap'
          data-row-action
        >
          {value || 'Slugg...'}
        </Badge>
      )
    : (
        <Button
          className='text-muted-foreground h-7 font-normal text-sm whitespace-nowrap px-2.5'
          variant='outline'
          onClick={() => setActive(true)}
        >
          {value || 'Slugg...'}
        </Button>
      )
}
