export function Medium ({ id }: { id: string }): JSX.Element {
  return (
    <div style={{ width: '450px' }}>
      <h1 className='font-bold text-lg py-4'>{`Medium - ${Date.now()}`}</h1>
      <p>Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.</p>
      <p>450px</p>
      <br />
      <code>{JSON.stringify(history.state, null, 2)}</code>
      <br />
      <code>this: {id}</code>
    </div>
  )
}

Medium.displayName = 'Medium'
