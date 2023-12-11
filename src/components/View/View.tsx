import { type PropsWithChildren } from 'react'

export const View = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <main className='px-3 h-full'>
      {children}
    </main>
  )
}
