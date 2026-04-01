import type { JSX } from 'react'

export const EnvironmentBanner = ({ environment }: { environment: string }): JSX.Element => (
  <div className={`shrink-0 flex w-full items-center justify-center py-0 ${environment === 'development' ? 'bg-approved' : 'bg-red-500'}`}>
    <span className='text-[8px] font-bold tracking-widest text-white'>
      {environment || 'STAGE'}
    </span>
  </div>
)
