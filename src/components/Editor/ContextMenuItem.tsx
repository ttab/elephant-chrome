import { ContextMenu } from '@ttab/textbit'
import { type PropsWithChildren } from 'react'

export const ContextMenuItem = ({ apply, children }: PropsWithChildren & {
  apply: () => void
}): JSX.Element => {
  return (
    <ContextMenu.Item
      className='
        grid
        gap-x-5
        p-[0.4rem]
        min-w-64
        text-sm
        group
        rounded
        cursor-default
        border-white
        hover:border-gray-200
        hover:bg-gray-100
        dark:border-slate-900
        dark:hover:border-slate-700
        dark:hover:bg-slate-800
      '
      func={apply}
    >
      {/* FIXME: Imports are strange... should not have to do it like this. */}
      {!!children
      && <>{children}</>}
    </ContextMenu.Item>
  )
}
