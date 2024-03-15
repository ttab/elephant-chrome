import { Button } from '@ttab/elephant-ui'
import { CircleCheck } from '@ttab/elephant-ui/icons'

// TODO: Should read current versions status
export const PlanDocumentStatus = (): JSX.Element => (
  <Button
    variant="ghost"
    className="flex w-10 p-0 px-2 data-[state=open]:bg-muted items-center"
  >
    <span className={'flex items-end'}>
      <CircleCheck
        fill='#4675C8'
        color='#ffffff'
        size={18}
        className='bg-[#4675C8] rounded-full'
        strokeWidth={1.75}
      />
    </span>
  </Button>
)
