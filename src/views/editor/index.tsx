// import { useWebSocket } from '@/hooks/useWebSocket'
import { useApi } from '@/hooks/useApi'
import { useMemo, useState } from 'react'
// import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'

export const Editor = (): JSX.Element => {
  const api = useApi()
  const [taskList, setTaskList] = useState<string[]>([])

  const provider = useMemo(() => {
    return new HocuspocusProvider({
      url: `ws://${api.endpoint}/documents/mydoc`,
      name: 'mydoc'
    })
  }, [api.endpoint])

  const tasks = provider.document.getArray('tasks')

  tasks.observe(() => {
    setTaskList(tasks.toArray() as string[])
  })


  return (
    <div className="p-4">
      <header>
        <h1 className="strong text-xl font-bold">Editor header</h1>
      </header>

      <main>
        <ul className="mt-4">
          {taskList.map((t) => {
            return <li>{t}</li>
          })}
        </ul>

        <p className="mt-4">
          <a className="px-4 py-2 bg-slate-300 font-bold rounded cursor-pointer opacity" onClick={(e) => {
            e.preventDefault()
            tasks.push(['buy milk'])
          }}>Send click count</a>
        </p>
      </main>
    </div>
  )
  // const [count, setCount] = useState<number>(0)

  // const [sendMessage] = useWebSocket((msg) => {
  //   console.log(`::=> ${msg}`)
  // })

  // const onClick = (): void => {
  //   const clicked = count + 1
  //   sendMessage(`Clicked ${clicked.toString()} time(s)`)
  //   setCount(clicked)
  // }

  // return (
  //   <div className="p-4">
  //     <header>
  //       <h1 className="strong text-xl font-bold">Editor header</h1>
  //     </header>

  //     <main>
  //       <p className="mt-4">
  //         Editor content...!
  //       </p>
  //       <p className="mt-4">
  //         <a className="px-4 py-2 bg-slate-300 font-bold rounded cursor-pointer opacity" onClick={(e) => {
  //           e.preventDefault()
  //           onClick()
  //         }}>Send click count</a>
  //       </p>
  //     </main>
  //   </div>
  // )
}
