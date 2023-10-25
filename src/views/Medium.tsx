import { type ViewProps } from '@/types'

export function Medium(props: ViewProps): JSX.Element {
  const { id } = props
  return (
    <div className='w-[450px] bg-blue-200 overflow-hidden'>
      <h1 className='font-bold text-lg py-4'>{`Medium - ${Date.now()}`}</h1>
      <p>Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.</p>
      <p>450px</p>
      <code>this: {id}</code>
    </div>
  )
}

Medium.displayName = 'Medium'
