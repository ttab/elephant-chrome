import { useContext } from 'react'
import { WebSocketProviderContext, type WebSocketProviderState } from '@/contexts/WebSocketProvider'

export const useWebSocket = (): WebSocketProviderState => {
  const context = useContext(WebSocketProviderContext)

  if (context?.webSocket === undefined) {
    throw new Error('useWebSocket must be used within an WebSocketProvider')
  }

  return context
}

// import { type MutableRefObject, useContext, useEffect, useRef, useState, useCallback } from 'react'
// import { ApiProviderContext } from '@/contexts/ApiProvider'

// type WSOnReceive = (msg: string) => void
// type WSSend = (msg: string) => void

// export const useWebSocket = (onMessage: WSOnReceive): WSSend => {
//   const context = useContext(ApiProviderContext)
//   console.log('RERENDER')
//   if (context === undefined) {
//     throw new Error('useWebSocket must be used within an ApiProvider')
//   }

//   const wsRef = useRef<WebSocket | undefined>(undefined)

//   const handleSend = useCallback((msg: string) => {
//     if (wsRef?.current && wsRef?.current?.readyState === wsRef.current?.OPEN) {
//       wsRef.current.send(msg)
//     }
//   }, [wsRef])

//   useEffect(() => {
//     console.log('EFFECT')
//     if (!wsRef.current) {
//       console.log('NO WSREF')
//       wsRef.current = new WebSocket(`ws://${context.apiUrl}/ws`)

//       wsRef.current.addEventListener('open', () => {
//         console.log('WebSocket connection opened')
//       })

//       wsRef.current.addEventListener('close', () => {
//         console.log('WebSocket connection closed')
//       })

//       wsRef.current.addEventListener('error', (e) => {
//         console.log(e)
//       })

//       wsRef.current.addEventListener('message', (event) => {
//         if (onMessage) {
//           onMessage(event.data)
//         }
//       })
//     }

//     return () => {
//       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//         wsRef.current.close()
//       }
//     }
//   })

//   return handleSend
// }
