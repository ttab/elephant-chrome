import React, {
  useImperativeHandle,
  useRef,
  type PropsWithChildren
} from 'react'
import { useAwareness } from '@/hooks'
import { Collaboration } from '@/defaults'

interface AwarenessProps extends PropsWithChildren {
  id: string
}

export const Awareness = React.forwardRef(({ id, children }: AwarenessProps, ref) => {
  const [focused, setIsFocused] = useAwareness(id)
  const awarenessRef = useRef(null)

  useImperativeHandle(ref, () => {
    return setIsFocused
  })

  const color = Collaboration.colors[focused?.color || ''] || ''
  return (
    <div ref={awarenessRef} className={`rounded ${focused ? 'ring' : ''} ${color}`}>
      {children}
    </div>
  )
})

Awareness.displayName = 'Awareness'
