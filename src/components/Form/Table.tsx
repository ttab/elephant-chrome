import { cva } from 'class-variance-authority'
import { type FormProps } from './Root'
import type { JSX } from 'react'

export const Table = ({ children, asDialog, className }: FormProps & {
  className?: string
}): JSX.Element => {
  const variants = cva('flex flex-col px-4',
    {
      variants: {
        asDialog: {
          false: 'pb-16',
          true: ''
        }
      }
    })

  return (
    <div className={variants({ asDialog, className })}>
      {children}
    </div>
  )
}
