import { cva } from 'class-variance-authority'
import { type FormProps } from './Root'

export const Table = ({ children, asDialog }: FormProps): JSX.Element => {
  const variants = cva('flex flex-col px-4',
    {
      variants: {
        asDialog: {
          false: 'pb-16',
          true: ''
        }
      }
    })

  return <div className={variants({ asDialog })}>
    {children}
  </div>
}
