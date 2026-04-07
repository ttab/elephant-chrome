import type { PropsWithChildren, JSX } from 'react'

export const Banner = ({ children }: PropsWithChildren): JSX.Element => (
  <div className='relative h-0 z-30'>
    <div className='absolute top-1 left-0 right-0 flex justify-center items-center pointer-events-none'>
      <div className='empty:hidden border bg-background rounded-lg text-sm px-5 py-3 shadow-xl pointer-events-auto'>
        {children}
      </div>
    </div>
  </div>
)
