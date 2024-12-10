import { useFetcher } from '@/hooks'
import { type Fetcher, type Source } from '@/hooks/useFetcher'
import { type PropsWithChildren } from 'react'
import { SWRConfig } from 'swr'

export const SWRProvider = <T extends Source, R>({ index, children }: PropsWithChildren & {
  index: Fetcher<T, R>
}): JSX.Element => {
  const fetcher = useFetcher<T, R>(index)

  return (
    <SWRConfig
      value={{
        fetcher: async (args: [unknown, R, {
          withPlanning: boolean
          withStatus: boolean
        }]) => await fetcher({
          params: args[1],
          options: args[2]
        }),
        revalidateOnFocus: false,
        revalidateOnReconnect: false
      }}
    >
      {children}
    </SWRConfig>
  )
}

