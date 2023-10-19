import { useApi } from '@/hooks/useApi'
import { useState } from 'react'

export const Editor = (): JSX.Element => {
  const [count, setCount] = useState<number>(0)
  const api = useApi()

  const onClick = (msg: string): void => {
    if (api.send) {
      api.send(msg)
    }
  }

  return (
    <>
      <header>
        <h1>Editor header</h1>
      </header>

      <main>
        <p>
          Editor content
        </p>
        <p>
          <a onClick={(e) => {
            e.preventDefault()
            onClick(count.toString())
            setCount(count + 1)
          }}>Send click count</a>
        </p>
      </main>
    </>
  )
}
