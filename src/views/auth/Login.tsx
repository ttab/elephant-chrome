import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useSession } from '@/hooks'
import { type JWT } from '@/types'

export const Login = (): JSX.Element => {
  const { apiUrl } = useApi()
  const [user, setUser] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [, setJwt] = useSession()
  const [failed, setFailed] = useState<boolean>(false)

  return (
    <div className="flex flex-row flex-auto justify-center">
      <form onSubmit={(e) => { e.preventDefault() }} className="self-center flex flex-col gap-4">
        <div>
          <input
            className="p-2 w-64 text-sm border border-gray-200 shadow-sm rounded"
            type="text" name="user" onChange={(e) => setUser(e.currentTarget.value)}
          />
        </div>
        <div>
          <input
            className="p-2 w-64 text-sm border border-gray-200 shadow-sm rounded"
            type="password" name="password" onChange={(e) => setPassword(e.currentTarget.value)}
          />
        </div>

        <div>
          <button
            className="p-2 w-64 text-sm border border-gray-300 text-bold center bg-gray-100 shadow-sm rounded"
            onClick={(e) => {
              e.preventDefault()
              if (!apiUrl) {
                console.log('NO URL')
                return
              }

              auth(apiUrl.href, user, password)
                .then(async ([status, jwt]) => {
                  if (status === 200 && jwt) {
                    setJwt(jwt)
                  } else {
                    setFailed(true)
                  }
                })
                .catch(ex => {
                  console.log('Failed login: ', ex.message)
                })
            }}>Login...</button>
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


async function auth(api: string, user: string, password: string): Promise<[number, JWT | undefined]> {
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
    return [200, await response.json()]
  }

  return [response.status, undefined]
}
