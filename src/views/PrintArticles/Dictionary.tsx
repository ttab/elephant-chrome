import { View, ViewHeader } from '@/components/View'
import { type ViewProps } from '@/types/index'
import { BookA, Pencil, Plus } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { type Hypenation } from '@ttab/elephant-tt-api/baboon'
import { Button, Label } from '@ttab/elephant-ui'

const HypenationItem = ({ isNew, word, hypenated }: { isNew: boolean, word: string, hypenated: string }) => {
  const [editMode, setEditMode] = useState(isNew ? true : false)
  return !editMode && !isNew
    ? (
        <li className='w-full flex justify-between items-center'>
          {word}
          <span className='text-gray-500'>/</span>
          {hypenated}
          <Button variant='ghost' size='sm' onClick={() => setEditMode(true)}>
            <Pencil strokeWidth={1.75} size={18} />
          </Button>
        </li>
      )
    : (
        <div className='flex items-end justify-between gap-2'>
          <Label>
            Ord
            <input type='text' value={word} className='border border-gray-300 rounded-md p-2' />
          </Label>
          <Label>
            Sammansättning
            <input type='text' value={hypenated} className='border border-gray-300 rounded-md p-2' />
          </Label>
          <Button size='sm' onClick={() => console.log('Spara')}>Spara</Button>
          <Button variant='ghost' size='sm' onClick={() => setEditMode(false)}>
            Avbryt
          </Button>
        </div>
      )
}

const Dictionary = ({ asDialog, onDialogClose, className }: ViewProps): JSX.Element => {
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const [hyphenations, setHyphenations] = useState<Hypenation[]>([])
  const [isNew, setIsNew] = useState(false)
  const handleListHyphenations = async () => {
    if (!session?.accessToken) {
      toast.error('Ingen access token hittades')
      return
    }

    if (!baboon) {
      toast.error('Något gick fel när avstämningsordlista skulle hämtas')
      return
    }
    const hyphenations = await baboon?.listHypenations({
      language: 'sv',
      page: 0n
    }, session?.accessToken)
    setHyphenations(hyphenations?.response?.items || [])
    console.log(hyphenations)
  }

  useEffect(() => {
    handleListHyphenations()
  }, [])

  return (
    <View.Root asDialog={asDialog} className={cn(className, 'min-h-[900px]')}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {asDialog && (
            <div className='flex h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title name='dictionary' title='Sammansättningar' icon={BookA} iconColor='#006bb3' />
            </div>
          )}
          <div className='flex items-center justify-end mt-4'>
            <Button
              onClick={() => setIsNew(!isNew)}
              size='sm'
              className='mb-4 flex items-center gap-2'
            >
              <Plus strokeWidth={1.75} size={18} />
              Ny sammansättning
            </Button>
          </div>
        </ViewHeader.Content>
        <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog}>
        </ViewHeader.Action>
      </ViewHeader.Root>
      <View.Content className='p-4 w-full'>
        <div className='flex flex-col gap-2'>
          <ul className='flex flex-col gap-2'>
            {isNew && <HypenationItem isNew={isNew} word='' hypenated='' />}
            {hyphenations.map((hyphenation) => (
              <HypenationItem key={hyphenation.word} isNew={false} word={hyphenation.word} hypenated={hyphenation.hypenated} />
            ))}
          </ul>
        </div>
      </View.Content>
    </View.Root>
  )
}

export default Dictionary
