import { useSession } from 'next-auth/react'
import { AwarenessDocument } from '../../AwarenessDocument'
import { type PropsWithChildren } from 'react'

export const Root = ({ children }: PropsWithChildren): JSX.Element | null => {
  const { data } = useSession()

  return data?.user.sub
    ? (
        <AwarenessDocument documentId={data?.user.sub}>
          {children}
        </AwarenessDocument>
      )
    : null
}

