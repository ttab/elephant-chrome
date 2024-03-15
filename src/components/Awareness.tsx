import React, {
  useImperativeHandle,
  useRef,
  type PropsWithChildren
} from 'react'
import { useAwareness } from '@/hooks'
import { Collaboration } from '@/defaults'
import { cn } from '@ttab/elephant-ui/utils'


/**
 * Wrapper around anything that should be able to indicate awareness locally
 * as well as signal awareness to remote users. Children use the ref function
 * to signal awareness using true/false.
 *
 * If prop `visual` is false, the visual ring is suppressed
 */
export const Awareness = React.forwardRef(({ name, className, visual = true, children }: PropsWithChildren & {
  name: string
  visual?: boolean
  className?: string
}, ref) => {
  const [states, setIsFocused] = useAwareness(name)
  const awarenessRef = useRef(null)

  useImperativeHandle(ref, () => {
    return setIsFocused
  })

  // Currently we only show one user color as ring around remotely focused element
  const color = Collaboration.colors[states[0]?.focus?.color || '']?.ring
  const defaultClassName = cn('rounded', visual && !!color && ['ring', color])

  return (
    <div ref={awarenessRef} className={className || defaultClassName}>
      {children}
    </div>
  )
})

Awareness.displayName = 'Awareness'
