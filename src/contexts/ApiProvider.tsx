import { createContext, useEffect, useState, useMemo } from 'react'

interface ApiProviderProps {
  children: React.ReactNode
  host?: string
  port?: number
}

export interface ApiProviderState {
  url: string | undefined
}

const initialState: ApiProviderState = {
  url: undefined
}

export const ApiProvider = ({ children, host = 'localhost', port = 5183, ...props }: ApiProviderProps): JSX.Element => {
  const [hostName] = useState(host)
  const [portNumber] = useState(port)
  const socket = new WebSocket(`ws://${hostName}:${portNumber}/api/ws`)

  // FIXME: This does not work, might need useRef and stuff... WiP
  useEffect(() => {
    socket.addEventListener('open', () => {
      console.log('WebSocket connection opened')
    })

    socket.addEventListener('message', (event) => {
      console.log('Received message:', event.data)
    })

    socket.addEventListener('close', (event) => {
      console.log('Closed socket:', event)
    })

    // Clean up and close the socket when the component unmounts
    return () => {
      socket.close()
    }
  })

  const value = {
    url: `${hostName}:${portNumber}/api`
  }

  return (
    <ApiProviderContext.Provider {...props} value={value}>
      {children}
    </ApiProviderContext.Provider>
  )
}

export const ApiProviderContext = createContext<ApiProviderState>(initialState)
