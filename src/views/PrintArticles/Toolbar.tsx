import { Button } from '@ttab/elephant-ui'
import { ListFilter } from '@ttab/elephant-ui/icons'

export const Toolbar = (): JSX.Element => {
  return (
    <div className='flex items-center justify-between py-1 px-4 border-b sticky top-0 bg-whitez-10'>
      <div className='flex flex-1 items-center space-x-2'>
        <Button
          variant='ghost'
          size='sm'
          className='px-2 py-0 flex gap-2 items-center'
          onClick={() => {
            window.alert('Ej implementerat')
          }}
        >
          <ListFilter strokeWidth={1.75} size={18} />
        </Button>
      </div>
    </div>
  )
}
