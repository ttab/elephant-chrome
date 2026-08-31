import { Button, SheetClose } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { SettingsIcon } from '@ttab/elephant-ui/icons'
import type { Session } from '@/types/session'
import { Avatar } from '../Avatar'
import { Link } from '@/components'
import { signOut } from '@ttab/tt-session/react'
import { SESSION_BASE_PATH } from '@/contexts/SessionContext'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOutIcon } from '@ttab/elephant-ui/icons'

const hasUserDoc = (obj: object | undefined) => obj && Object.keys(obj).length > 0

export const UserInfo = ({ user, data }: {
  user?: object
  data: Session | null
}): JSX.Element => {
  const { t } = useTranslation()

  return (
    <div className='justify-self-end flex flex-col items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mt-10 pb-6'>
      <div className={cn({
        'border-green-400': hasUserDoc(user),
        'border-red-400': !hasUserDoc(user)
      }, 'border-4 rounded-full -mt-7')}
      >
        <Avatar user={data?.user} size='xl' variant='color' />
      </div>

      <div className='p-2 py-4 pb-4 leading-loose text-center'>
        <div className='font-bold'>{data?.user.name || `(${t('errors:messages.nameMissing')})`}</div>
        <div className='text-xs opacity-60'></div>
      </div>

      <div className='flex gap-2'>
        <SheetClose asChild>
          <Link
            to='UserPreferences'
            className='inline-flex items-center gap-2 rounded-md border bg-background px-3 h-9 text-sm hover:bg-accent'
          >
            <SettingsIcon strokeWidth={1.75} size={16} />
            {t('app:settings.settingsButton')}
          </Link>
        </SheetClose>

        <SheetClose asChild>
          <Button
            variant='outline'
            onClick={(event) => {
              event.preventDefault()

              localStorage.removeItem('trustGoogle')
              // Federated: this ends the Keycloak SSO session and lands on
              // AUTH_POST_LOGOUT_URI, which is what the old /api/signout did.
              signOut({ basePath: SESSION_BASE_PATH })
            }}
            className='inline-flex items-center gap-2 rounded-md border bg-background px-3 h-9 text-sm hover:bg-accent'
          >
            <LogOutIcon strokeWidth={1.75} size={16} />
            {t('app:mainMenu.logout')}
          </Button>
        </SheetClose>
      </div>
    </div>
  )
}
