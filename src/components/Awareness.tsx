import React, {
  useImperativeHandle,
  useRef,
  type PropsWithChildren
} from 'react'
import { useAwareness } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'


/**
 * Wrapper around anything that should be able to indicate awareness locally
 * as well as signal awareness to remote users. Children use the ref function
 * to signal awareness using true/false.
 *
 * Views (that represent a document) do not provide a path and gets no "awareness dots" rendered.
 * Fields provide a path (inside a document) as they want "awareness dots" rendered.
 */
export const Awareness = React.forwardRef(({ name, path, className: externalClassName, children }: PropsWithChildren & {
  name: string
  path?: string
  className?: string
}, ref) => {
  const [states, setIsFocused] = useAwareness(name)
  const awarenessRef = useRef(null)

  useImperativeHandle(ref, () => {
    return setIsFocused
  })

  const userColors = states
    .filter((state) => {
      return (path) ? path === state.focus?.path : true
    })
    .map((state) => state.focus?.color || 'rgb(121,121,121)')
    .filter(Boolean)

  const className = cn(
    (path) ? 'relative' : undefined,
    externalClassName
  )

  return (
    <div ref={awarenessRef} className={className}>
      {!!path && userColors.length > 0 && (
        <div className='absolute -top-2 -right-2 flex -space-x-1 -space-y-1 mint-w-2 min-h-2'>
          {userColors.map((backgroundColor, index) => (
            <span
              key={index}
              className='w-3 h-3 rounded-full'
              style={{
                zIndex: userColors.length - index, marginLeft: index * -4,
                backgroundColor,
                boxShadow: '1px 1px 5px -3px rgba(0, 0, 0, 0.5)'
              }}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  )
})

Awareness.displayName = 'Awareness'
