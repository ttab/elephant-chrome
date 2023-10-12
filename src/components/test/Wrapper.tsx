import { useMemo } from 'react'

export function ContentWrapper ({ children }: { children: JSX.Element }): JSX.Element {
  return useMemo(() => (
    <section className="flex-grow bg-gray-200 basis-full rounded-lg p-2 min-w-max">
      {children}
    </section>
  ), [children])
}
