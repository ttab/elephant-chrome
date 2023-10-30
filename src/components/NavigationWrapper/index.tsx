import { useMemo, useState } from 'react'
import { Maximize2, Minimize2 } from '@ttab/elephant-ui/icons'

export const NavigationWrapper = ({ children }: { children: JSX.Element }): JSX.Element => {
  const [expanded, setExpanded] = useState(false)

  return useMemo(() => {
    const variants = {
      maximized: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-gray-100 basis-full rounded-lg p-2',
      minimized: 'flex-grow bg-gray-200 basis-full rounded-lg p-2'
    }
    return (
      <section
        className={expanded ? variants.maximized : variants.minimized}
      >
        <div
          className="justify-end flex"
          onClick={() => { setExpanded(!expanded) }}
        >
          {expanded ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </div>
        {children}
      </section>
    )
  }, [children, expanded])
}
