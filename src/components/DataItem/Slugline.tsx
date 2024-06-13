import { Button } from '@ttab/elephant-ui'
import { useYValue } from '@/hooks/useYValue'

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
  const [slugLine] = useYValue<string | undefined>(path)

  return <Button
    className='text-muted-foreground h-7 font-normal text-sm whitespace-nowrap'
    variant='outline'
    onClick={() => setActive(true)}
  >
    {slugLine || 'Slugg...'}
  </Button >
}


function StaticSluglineByPath({ path }: {
  path: string
}): JSX.Element {
  const [slugLine] = useYValue<string | undefined>(path)

  return <StaticSluglineByValue value={slugLine || ''} />
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
    {value || 'Slugg...'}
  </Button >
}
