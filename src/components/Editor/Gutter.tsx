import { type PropsWithChildren } from 'react'
import Textbit from '@ttab/textbit'

export const Gutter = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <Textbit.Gutter className="w-14">
      {children}
    </Textbit.Gutter>
  )
}
