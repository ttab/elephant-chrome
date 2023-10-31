import { useState } from 'react'
import { useApi } from '@/hooks/useApi'

export const Login = (): JSX.Element => {
  const { api: endpoint } = useApi()
  const [user, setUser] = useState<string>('')
  const [password, setPassword] = useState<string>('')

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
              if (!endpoint) {
                return
              }

              auth(endpoint, user, password)
                .then((success) => {
                  if (success) {
                    window.location.replace('/')
                  }
                }).catch(ex => {
                  console.log('Failed login: ', ex.message)
                })
            }}>Login...</button>
        </div>
      </form >
    </div>
  )
}


async function auth(api: string, user: string, password: string): Promise<boolean> {
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

  return response.status === 200
}
