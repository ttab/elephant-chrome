import { type Plugin } from '@ttab/textbit'
import { FocusBlock } from './FocusBlock'

export const Figure = ({ children }: Plugin.ComponentProps): JSX.Element => {
  return (
    <FocusBlock className='my-2'>
      <figure className="flex gap-1 flex-col my-2 min-h-10 group-data-[state='active']:ring-1 ring-offset-4 rounded-sm" draggable={false}>
        {children}
      </figure>
    </FocusBlock>
  )
}
