import { useMemo, useState } from 'react'

export const NavigationWrapper = ({ children }: { children: JSX.Element }): JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  const variants = {
    maximized: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-gray-100 basis-full rounded-lg p-2',
    maxIcon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize-2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>,
    minimized: 'flex-grow bg-gray-200 basis-full rounded-lg p-2 min-w-max',
    minIcon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
  }

  return useMemo(() => (
    <section className={expanded ? variants.maximized : variants.minimized}>
      <div className="absolute right-0 top-0 p-2"
        onClick={() => { setExpanded(!expanded) }}
      >
        {expanded ? variants.maxIcon : variants.minIcon}
      </div>
      {children}
    </section>
  ), [children, expanded, variants.maxIcon, variants.minIcon, variants.maximized, variants.minimized])
}
