export const Small = ({ id }: { id: string }): JSX.Element => {
  return (
    <div className="w-[150px] bg-red-200 overflow-hidden">
      <h1 className='font-bold text-lg py-4'>{`Small - ${Date.now()}`}</h1>
      <p>Lorem ipsum</p>
      <p>150px</p>
      <code>this: {id}</code>
    </div>
  )
}

Small.displayName = 'Small'
