import { Button, SheetClose } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import type { Session } from 'next-auth'
import { Avatar } from '../Avatar'
import { signOut } from 'next-auth/react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

const BASE_URL = import.meta.env.BASE_URL
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
        <div className='font-bold'>{data?.user.name || '(Namn saknas)'}</div>
        <div className='text-xs opacity-60'></div>
      </div>

      <SheetClose asChild>
        <Button
          variant='outline'
          onClick={(event) => {
            event.preventDefault()

            signOut({ redirectTo: `${BASE_URL}/api/signout`, redirect: true })
              .catch((error) => console.error(error))
            localStorage.removeItem('trustGoogle')
          }}
          className='gap-4'
        >
          {t('app.mainMenu.logout')}
        </Button>
      </SheetClose>
    </div>
  )
}
