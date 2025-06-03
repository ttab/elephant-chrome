import { View, ViewHeader } from '@/components/View'
import { type ViewProps } from '@/types/index'
import { BookA, Pencil, Plus, Trash } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { type Hypenation } from '@ttab/elephant-tt-api/baboon'
import { Button, Label } from '@ttab/elephant-ui'

const HypenationItem = ({ isNew, setIsNew, word, hypenated, handleListHyphenations }: { isNew: boolean, setIsNew: (isNew: boolean) => void, word: string, hypenated: string, handleListHyphenations: () => void }) => {
  const [_word, setWord] = useState(word)
  const [_hypenated, setHypenated] = useState(hypenated)
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const [editMode, setEditMode] = useState(isNew ? true : false)
  return (
    <div className='grid grid-cols-3 gap-2'>
      <input
        disabled={!editMode && !isNew}
        type='text'
        value={_word}
        onChange={(e) => setWord(e.target.value)}
        className='col-span-1 border border-gray-300 rounded-md p-2'
      />
      <input
        disabled={!editMode}
        type='text'
        value={_hypenated}
        onChange={(e) => setHypenated(e.target.value)}
        className='col-span-1 border border-gray-300 rounded-md p-2'
      />
      {editMode
        ? (
            <div className='col-span-1 flex items-end justify-end gap-2'>
              <Button
                size='sm'
                onClick={() => {
                  (async () => {
                    await baboon?.setHypenation({
                      language: 'sv',
                      word: _word,
                      hypenated: _hypenated,
                      ignore: false
                    }, session?.accessToken || '')
                    handleListHyphenations()
                    setEditMode(false)
                    setIsNew(false)
                  })().catch(console.error)
                }}
              >
                Spara
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setEditMode(false)
                  setIsNew(false)
                }}
              >
                Avbryt
              </Button>
              {!isNew && (
                <Button
                  className='bg-red-500 hover:bg-red-400'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    (async () => {
                      await baboon?.removeHypenation({
                        language: 'sv',
                        word: _word
                      }, session?.accessToken || '')
                      handleListHyphenations()
                    })().catch(console.error)
                  }}
                >
                  <Trash strokeWidth={1.75} size={18} className='text-white' />
                </Button>
              )}
            </div>
          )
        : (
            <div className='col-span-1 flex items-end justify-end gap-2'>
              <Button variant='ghost' size='sm' onClick={() => setEditMode(true)}>
                <Pencil strokeWidth={1.75} size={18} />
              </Button>
            </div>
          )}
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
      .catch((ex) => {
        console.error('Error listing hyphenations:', ex)
        toast.error('Kunde inte lista hyphenations')
      })
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
              Ny
            </Button>
          </div>
        </ViewHeader.Content>
        <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog}>
        </ViewHeader.Action>
      </ViewHeader.Root>
      <View.Content className='p-4 w-full'>
        <div className='flex flex-col gap-2'>
          <div className='grid grid-cols-3 gap-2'>
            <h3 className='col-span-1'>
              Ord
            </h3>
            <h3 className='col-span-1'>
              Sammansättning
            </h3>
            <Label className='col-span-1'>
            </Label>
          </div>
          <ul className='flex flex-col gap-2'>
            {isNew && <HypenationItem isNew={isNew} setIsNew={setIsNew} word='' hypenated='' handleListHyphenations={() => { void handleListHyphenations() }} />}
            {hyphenations.map((hyphenation) => (
              <HypenationItem key={hyphenation.word} isNew={false} setIsNew={setIsNew} word={hyphenation.word} hypenated={hyphenation.hypenated} handleListHyphenations={() => { void handleListHyphenations() }} />
            ))}
          </ul>
        </div>
      </View.Content>
    </View.Root>
  )
}

export default Dictionary
