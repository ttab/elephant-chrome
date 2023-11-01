interface ViewHeaderProps {
  title: string
}

export const ViewHeader = ({ title }: ViewHeaderProps): JSX.Element => {
  return (
    <header className='relative top-0 group-last:w-[calc(100%-7rem)]'>
      <h1 className='font-bold text-2xl mb-8'>{title}</h1>
    </header>
  )
}
