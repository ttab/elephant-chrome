import apiClient from '@/lib/apiclient'

export const fetcher = async ([queryString, index, SIZE]: [queryString: string, index: number, SIZE: number]) => {
  const client = await apiClient(undefined, undefined)
  const res = await client.content.search('image', { q: queryString, s: SIZE, fr: (index) * SIZE })
  return res
  }


  // export const fetcher2 = ([queryString, index, SIZE]) => {
  //   return apiClient(undefined, undefined)
  //     .then((client) => client.content.search('image', { q: queryString, s: SIZE, fr: (index) * SIZE }))
  //     .then((res) => res)
  // }