import { CircleCheck } from '@ttab/elephant-ui/icons'

// TODO: Should read current versions status
export const PlanDocumentStatus = (): JSX.Element => (
  <CircleCheck
    fill='#4675C8'
    color='#ffffff'
    className='size-4 bg-[#4675C8] rounded-full'
    strokeWidth={1.75}
  />
)
