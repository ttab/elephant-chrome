import { useState } from 'react'
import { type ViewProps, type ViewMetadata } from '@/types'
import { Button, Checkbox } from '@ttab/elephant-ui'
import { signOut } from 'next-auth/react'
import { ViewHeader } from '@/components/View'
import { LogOut } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

const meta: ViewMetadata = {
  name: 'Logout',
  path: `${import.meta.env.BASE_URL || ''}/logout`,
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

const trustGoogleLocalStorage = (): boolean => localStorage.getItem('trustGoogle') === 'true' || false
export const Logout = (props: ViewProps): JSX.Element => {
  const [trustGoogle, setTrustGoogle] = useState<boolean | 'indeterminate'>(trustGoogleLocalStorage())

  return (
    <div className={cn('flex flex-col h-screen', props?.className)}>
      <div className="grow-1">
        <ViewHeader.Root>
          <ViewHeader.Title title='Logga ut' icon={LogOut} />
        </ViewHeader.Root>
      </div>

      <section className="flex justify-center align">
        <div className="max-w-screen-md pt-10">

          <div className="flex flex-row flex-auto justify-center">
            <div className='self-center flex flex-col gap-4'>

              <Button
                onClick={() => {
                  signOut({ callbackUrl: import.meta.env.BASE_URL })
                    .catch((error) => console.log(error))
                }}
                size="lg" className='space-x-1' variant='outline'>
                Logga ut
              </Button>

              {trustGoogle && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" defaultChecked={trustGoogle} onCheckedChange={(state) => {
                    localStorage.setItem('trustGoogle', state ? 'true' : 'false')
                    setTrustGoogle(state)
                  }} />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Kom ihåg mig nästa gång
                  </label>
                </div>)}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

Logout.meta = meta
