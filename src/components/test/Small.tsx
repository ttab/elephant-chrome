export function Small ({ id }: { id: string }): JSX.Element {
  return (
    <div style={{ width: '150px' }}>
      <h1 className='font-bold text-lg py-4'>{`Small - ${Date.now()}`}</h1>
      <p>Lorem ipsum</p>
      <p>150px</p>
      <code>{JSON.stringify(history.state, null, 2)}</code>
      <code>this: {id}</code>
    </div>
  )
}

Small.displayName = 'Small'
