import React, {
  useImperativeHandle,
  useRef,
  type PropsWithChildren
} from 'react'
import { useAwareness } from '@/hooks'
import { Collaboration } from '@/defaults'
import { cn } from '@ttab/elephant-ui/utils'

interface AwarenessProps extends PropsWithChildren {
  name: string
  visual?: boolean
}

/**
 * Wrapper around anything that should be able to indicate awareness locally
 * as well as signal awareness to remote users. Children use the ref function
 * to signal awareness using true/false.
 *
 * If prop `visual` is false, the visual ring is suppressed
 */
export const Awareness = React.forwardRef(({ name, visual = true, children }: AwarenessProps, ref) => {
  const [states, setIsFocused] = useAwareness(name)
  const awarenessRef = useRef(null)

  useImperativeHandle(ref, () => {
    return setIsFocused
  })

  // Currently we only show one user color as ring around remotely focused element
  const color = Collaboration.colors[states[0]?.focus?.color || '']?.ring
  return (
    <div ref={awarenessRef} className={cn('rounded', visual && !!color && ['ring', color])}>
      {children}
    </div>
  )
})

Awareness.displayName = 'Awareness'
