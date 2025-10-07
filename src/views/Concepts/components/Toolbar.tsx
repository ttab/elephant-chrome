import { SearchBar } from './SearchBar'

export const Toolbar = ({ placeholder }: { placeholder: string }): JSX.Element => {
  return (
    <div className='bg-background flex flex-wrap grow items-center space-x-2 border-b py-1 pr-2.5 sticky top-0 z-10'>
      <SearchBar placeholder={placeholder} />
    </div>
  )
}
