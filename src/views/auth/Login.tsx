import { useState } from 'react'
import { useSession } from '@/hooks'

import { Input, Button } from '@ttab/elephant-ui'
import { authenticate } from '@/lib/authenticate'

export const Login = (): JSX.Element => {
  const [user, setUser] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const { setJwt } = useSession()
  const [failed, setFailed] = useState<boolean>(false)

  return (
    <div className="flex flex-row flex-auto justify-center">
      <form onSubmit={(e) => { e.preventDefault() }} className="self-center flex flex-col gap-4">
        <div>
          <Input
            className="p-2 w-64 text-sm border border-gray-200 shadow-sm rounded"
            type="text" name="user" onChange={(e) => setUser(e.currentTarget.value)}
          />
        </div>
        <div>
          <Input
            className="p-2 w-64 text-sm border border-gray-200 shadow-sm rounded"
            type="password" name="password" onChange={(e) => setPassword(e.currentTarget.value)}
          />
        </div>

        <div>
          <Button
            onClick={(e) => {
              e.preventDefault()
              authenticate(user, password)
                .then(jwt => {
                  if (!jwt) {
                    setFailed(true)
                  }
                  setJwt(jwt)
                })
                .catch(() => {
                  setFailed(true)
                })
            }}>Login...</Button>
        </div>


        <div className="pt-4 text-sm text-red-500 text-center">
          {failed
            ? <p>Failed logging in<br /> Verify your credentials and try again</p>
            : <p>&nbsp;<br />&nbsp;</p>
          }
        </div>
      </form >
    </div >
  )
}
