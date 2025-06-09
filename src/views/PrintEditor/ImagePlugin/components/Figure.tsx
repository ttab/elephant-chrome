import { type Plugin } from '@ttab/textbit'
import { FocusBlock } from './FocusBlock'

export const Figure = ({ children }: Plugin.ComponentProps): JSX.Element => {
  return (
    <FocusBlock className='my-2'>
      <figure draggable={false} className='flex gap-1 flex-col min-h-10 rounded-sm'>
        {children}
      </figure>
    </FocusBlock>
  )
}
