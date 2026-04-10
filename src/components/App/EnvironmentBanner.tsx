import type { JSX } from 'react'

export const EnvironmentBanner = ({ environment }: { environment: string }): JSX.Element => (
  <div className={`absolute z-100 h-2 shrink-0 flex w-full items-center justify-center py-0 ${environment === 'development' ? 'bg-approved' : 'bg-red-500'}`}>
    <span className='text-[.4rem] font-bold tracking-widest text-white'>
      {environment || 'STAGE'}
    </span>
  </div>
)
