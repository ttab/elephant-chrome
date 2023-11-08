import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useSession } from '@/hooks'

import { Input, Button } from '@ttab/elephant-ui'

export const Login = (): JSX.Element => {
  const { apiUrl } = useApi()
  const [user, setUser] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const { setJwtToken } = useSession()
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
              if (!apiUrl) {
                console.log('NO URL')
                return
              }

              auth(apiUrl.href, user, password)
                .then(async ([status, jwtToken]) => {
                  if (status === 200 && jwtToken) {
                    setJwtToken(jwtToken)
                  } else {
                    setFailed(true)
                  }
                })
                .catch(ex => {
                  console.log('Failed login: ', ex.message)
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


async function auth(api: string, user: string, password: string): Promise<[number, string | undefined]> {
  const response = await fetch(`${api}/user`, {
    method: 'post',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user,
      password
    })
  })

  if (response.status === 200) {
    return [200, await response.text()]
  }

  return [response.status, undefined]
}
