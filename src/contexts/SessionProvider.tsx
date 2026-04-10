import type { PropsWithChildren } from 'react'
import { LoadingText } from '@/components/LoadingText'
import { SessionProvider as NextSessionProvider, useSession } from 'next-auth/react'
import { View } from '../components'
import { Login } from '../views'

export const SessionProvider = ({ children }: PropsWithChildren) => (
  <NextSessionProvider refetchOnWindowFocus={false} basePath={`${import.meta.env.BASE_URL}/api/auth`} refetchInterval={150}>
    <Session>{children}</Session>
  </NextSessionProvider>
)

const Session = ({ children }: PropsWithChildren) => {
  const { status, data: session } = useSession()

  if (status === 'loading') {
    return (
      <View.Root>
        <View.Content>
          <div className='flex items-center justify-center h-screen'>
            <div className='flex-col w-1/3'>
              <LoadingText>Hämtar session...</LoadingText>
            </div>
          </div>
        </View.Content>
      </View.Root>
    )
  }

  if (status === 'unauthenticated' || !session || session.error) {
    const callbackUrl = window.location.href.replace(window.location.origin, '')
    return (
      <div className='relative flex h-screen flex-col'>
        <Login callbackUrl={callbackUrl} />
      </div>
    )
  }

  return <>{children}</>
}
