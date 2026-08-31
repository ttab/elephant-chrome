import type { PropsWithChildren } from 'react'
import { LoadingText } from '@/components/LoadingText'
import { SessionClientProvider, useSession } from './SessionContext'
import { View } from '../components'
import { Login } from '../views'
import { useTranslation } from 'react-i18next'

export const SessionProvider = ({ children }: PropsWithChildren) => (
  <SessionClientProvider>
    <Session>{children}</Session>
  </SessionClientProvider>
)

const Session = ({ children }: PropsWithChildren) => {
  const { status, data: session, identityLoaded } = useSession()
  const { t } = useTranslation()

  // `loading` covers a cold start, a rate limit, a degraded store and a dropped
  // connection — everything except a definitive 401. Waiting here rather than
  // showing the login screen is what keeps a Redis blip from bouncing everyone
  // through Keycloak at once.
  if (status === 'loading' || (status === 'authenticated' && !identityLoaded)) {
    return (
      <View.Root>
        <View.Content>
          <div className='flex items-center justify-center h-screen'>
            <div className='flex-col w-1/3'>
              <LoadingText>{t('misc.fetchingSession')}</LoadingText>
            </div>
          </div>
        </View.Content>
      </View.Root>
    )
  }

  if (status === 'unauthenticated' || !session) {
    const callbackUrl = window.location.href.replace(window.location.origin, '')
    return (
      <div className='relative flex h-screen flex-col'>
        <Login callbackUrl={callbackUrl} />
      </div>
    )
  }

  return <>{children}</>
}
