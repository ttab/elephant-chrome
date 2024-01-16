import React, {
  useImperativeHandle,
  useRef,
  type PropsWithChildren,
  useMemo
} from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { useAwareness } from '@/hooks/useAwareness'
import { Awareness as Colors } from '@/defaults'

interface AwarenessProps extends PropsWithChildren {
  id: string
}

export const Awareness = React.forwardRef(({ id, children }: AwarenessProps, ref) => {
  const [focused, setIsFocused] = useAwareness(id)
  const awarenessRef = useRef(null)

  useImperativeHandle(ref, () => {
    return setIsFocused
  })

  // User awareness object only have rgb value. Swap imported colors to
  // have rgb as key and name as value. Then we can get the value for styling.
  const colorMap = useMemo(() => {
    return Object.fromEntries(Object.entries(Colors.colors).map(([key, value]) => [value, key]))
  }, [])

  const style = cva('rounded', {
    variants: {
      isFocused: {
        true: 'ring'
      },
      color: {
        red: 'ring-red-400',
        orange: 'ring-orange-400',
        amber: 'ring-amber-400',
        lime: 'ring-lime-400',
        cyan: 'ring-cyan-400',
        emerald: 'ring-emerald-400',
        teal: 'ring-teal-400',
        indigo: 'ring-indigo-400',
        violet: 'ring-violet-400',
        purple: 'ring-purple-400',
        fuchsia: 'ring-fuchsia-400',
        rose: 'ring-rose-400',
        none: ''
      }
    }
  })

  const color = colorMap[focused?.color || 'none'] as 'red' | 'orange' | 'amber' | 'lime' | 'cyan' | 'emerald' | 'teal' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'rose' | null | undefined
  return (
    <div ref={awarenessRef} className={cn(style({ isFocused: !!focused, color }))}>
      {children}
    </div>
  )
})

Awareness.displayName = 'Awareness'
