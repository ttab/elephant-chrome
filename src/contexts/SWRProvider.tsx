import { useFetcher } from '@/hooks'
import { type Fetcher, type Source } from '@/hooks/useFetcher'
import { type PropsWithChildren } from 'react'
import { SWRConfig } from 'swr'

export const SWRProvider = <T extends Source>({ index, children }: PropsWithChildren & {
  index: Fetcher<T>
}): JSX.Element => {
  const fetcher = useFetcher<T>(index)

  return (
    <SWRConfig
      value={{
        fetcher: async (args) => await fetcher({ from: args[1], to: args[2], options: args[3] }),
        revalidateOnFocus: false,
        revalidateOnReconnect: false
      }}
        >
      {children}
    </SWRConfig>
  )
}

