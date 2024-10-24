import { type FormProps } from './Root'

export const Table = ({ children }: FormProps): JSX.Element => (
  <div className='flex flex-col w-full px-4 pb-10'>
    {children}
  </div>
)
