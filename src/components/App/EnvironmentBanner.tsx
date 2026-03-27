import type { JSX } from 'react'

export const EnvironmentBanner = (): JSX.Element => (
  <div className='fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-0 bg-red-600'>
    {/* eslint-disable-next-line i18next/no-literal-string */}
    <span className='text-[8px] font-bold tracking-widest text-white'>
      STAGE
    </span>
  </div>
)
