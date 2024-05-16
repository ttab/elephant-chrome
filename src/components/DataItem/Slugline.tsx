import type * as Y from 'yjs'
import { Button } from '@ttab/elephant-ui'
import { useYObserver } from '@/hooks'

export const SluglineButton = ({ path, value, setActive }: {
  path?: string
  value?: string
  setActive?: ((value: boolean) => void) | null
}): JSX.Element => {
  if (typeof value === 'string') {
    return <StaticSluglineByValue value={value} />
  }

  if (typeof path === 'string' && !setActive) {
    return <StaticSluglineByPath path={path} />
  }

  if (typeof path === 'string' && setActive) {
    return <EditableSlugline path={path} setActive={setActive} />
  }

  return <></>
}


function EditableSlugline({ path, setActive }: {
  path: string
  setActive: ((value: boolean) => void)
}): JSX.Element {
  const { get } = useYObserver('meta', path)

  return <Button
    className='text-muted-foreground h-7 font-normal text-sm whitespace-nowrap'
    variant='outline'
    onClick={() => setActive(true)}
  >
    {(get('value') as Y.XmlText)?.toJSON() || 'Slugline...'}
  </Button >
}


function StaticSluglineByPath({ path }: {
  path: string
}): JSX.Element {
  const { get } = useYObserver('meta', path)

  return <StaticSluglineByValue value={(get('value') as Y.XmlText)?.toJSON() || ''} />
}


function StaticSluglineByValue({ value }: {
  value: string
}): JSX.Element {
  if (!value) {
    return <></>
  }

  return <Button
    className='text-muted-foreground h-7 px-2 font-normal text-sm whitespace-nowrap hover:bg-background hover:text-muted-foreground hover:cursor-default'
    variant='outline'
  >
    {value || 'Slugline...'}
  </Button >
}
