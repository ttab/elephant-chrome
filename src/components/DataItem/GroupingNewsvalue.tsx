import { NewsvalueMap } from '@/defaults/newsvalueMap'

export const GroupingNewsvalue = ({ newsvalue }: {
  newsvalue: string
}): JSX.Element => {
  const current = NewsvalueMap[newsvalue]
  const Icon = current.icon

  return (
    <span className='inline-flex items-center justify-center bg-white text-gray-800 font-bold rounded-full ring-1 ring-gray-300 shadow-md p-2'>
      {Icon && <Icon {...current.iconProps} />}
      {current.value}
    </span>)
}
