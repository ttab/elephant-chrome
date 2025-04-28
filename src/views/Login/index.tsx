import { type ViewProps, type ViewMetadata } from '@/types'
import { useState, useEffect } from 'react'
import { Button, Checkbox } from '@ttab/elephant-ui'
import { signIn } from 'next-auth/react'
import { LoadingText } from '@/components/LoadingText'
import { useIndexedDB } from '../../../src/datastore/hooks/useIndexedDB'

const meta: ViewMetadata = {
  name: 'Login',
  path: `${import.meta.env.BASE_URL || ''}/login`,
  widths: {
    sm: 12,
    md: 12,
    lg: 12,
    xl: 12,
    '2xl': 12,
    hd: 12,
    fhd: 12,
    qhd: 12,
    uhd: 12
  }
}

// TODO: Should be a part of a general settings object saved to local storage
const trustGoogleLocalStorage = (): boolean => localStorage.getItem('trustGoogle') === 'true' || false

const LoginForm = ({ callbackUrl }: {
  callbackUrl?: string
}): JSX.Element => {
  const [trustGoogle, setTrustGoogle] = useState<boolean | 'indeterminate'>(trustGoogleLocalStorage())
  const IDB = useIndexedDB()

  return (
    <div className='flex flex-row flex-auto justify-center'>
      <div className='self-center flex flex-col gap-4'>
        <Button
          onClick={() => {
            (async () => {
              await IDB.remove()
            })().catch((err) => console.error(err))
            signIn('keycloak', { callbackUrl: callbackUrl || import.meta.env.BASE_URL })
              .catch((error) => console.error(error))
          }}
          size='lg'
          className='space-x-1'
          variant='outline'
        >
          <p>Logga in med</p>
          <svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'>
            <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' fill='#4285F4' />
            <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' fill='#34A853' />
            <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' fill='#FBBC05' />
            <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' fill='#EA4335' />
            <path d='M1 1h22v22H1z' fill='none' />
          </svg>
          oogle
        </Button>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='remember'
            defaultChecked={trustGoogle}
            onCheckedChange={(state) => {
              localStorage.setItem('trustGoogle', state ? 'true' : 'false')
              setTrustGoogle(state)
            }}
          />
          <label
            htmlFor='remember'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Kom ihåg mig nästa gång
          </label>
        </div>
      </div>
    </div>
  )
}

const LoginAutomatic = ({ callbackUrl }: {
  callbackUrl?: string
}): JSX.Element => {
  useEffect(() => {
    signIn('keycloak', { callbackUrl: callbackUrl || import.meta.env.BASE_URL })
      .catch((error) => console.error(error))
  }, [callbackUrl])
  return <LoadingText>Loggar in...</LoadingText>
}

export const Login = (props: ViewProps & {
  callbackUrl?: string
}): JSX.Element => {
  if (trustGoogleLocalStorage()) {
    return <LoginAutomatic callbackUrl={props.callbackUrl} />
  } else {
    return <LoginForm callbackUrl={props.callbackUrl} />
  }
}

Login.meta = meta
