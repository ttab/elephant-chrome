import { type PropsWithChildren } from 'react'

export const Content = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <div className='flex flex-1 gap-4 items-center h-14 grow'>
      {children}
    </div>
  )
}
