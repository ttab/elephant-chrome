import { useWebSocket } from '@/hooks/useWebSocket'
import { useState } from 'react'

export const Editor = (): JSX.Element => {
  const [count, setCount] = useState<number>(0)
  const ws = useWebSocket()

  const onClick = (msg: string): void => {
    if (ws?.webSocket?.current) {
      ws?.webSocket?.current.send(`Clicked ${msg} time(s)`)
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
