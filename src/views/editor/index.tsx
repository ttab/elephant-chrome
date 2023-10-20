import { useWebSocket } from '@/hooks/useWebSocket'
import { useState } from 'react'

export const Editor = (): JSX.Element => {
  const [count, setCount] = useState<number>(0)

  const [sendMessage] = useWebSocket((msg) => {
    console.log(`::=> ${msg}`)
  })

  const onClick = (): void => {
    const clicked = count + 1
    sendMessage(`Clicked ${clicked.toString()} time(s)`)
    setCount(clicked)
  }

  return (
    <div className="p-4">
      <header>
        <h1 className="strong text-xl font-bold">Editor header</h1>
      </header>

      <main>
        <p className="mt-4">
          Editor content...!
        </p>
        <p className="mt-4">
          <a className="px-4 py-2 bg-slate-300 font-bold rounded cursor-pointer opacity" onClick={(e) => {
            e.preventDefault()
            onClick()
          }}>Send click count</a>
        </p>
      </main>
    </div>
  )
}
