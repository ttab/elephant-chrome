import { useSession } from 'next-auth/react'
import { type PropsWithChildren } from 'react'

export interface NewItem {
  id: string
  timestamp: number
}

export const Root = ({ children }: PropsWithChildren): JSX.Element | null => {
  const { data } = useSession()

  return data?.user.sub
    ? (
        <div>
          {children}
        </div>
      )
    : null
}

