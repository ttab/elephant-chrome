import { View, ViewHeader } from '@/components/View'
import { type ViewProps } from '@/types/index'
import { BookA, Check, Pencil, Plus, Trash } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { type Hypenation } from '@ttab/elephant-tt-api/baboon'
import { Button, ScrollArea } from '@ttab/elephant-ui'
import { Prompt } from '@/components/Prompt'

const HypenationItem = ({ isNew, setIsNew, word, hypenated, ignore, handleListHyphenations }: { isNew: boolean, setIsNew: (isNew: boolean) => void, word: string, hypenated: string, ignore: boolean, handleListHyphenations: () => void }) => {
  const [_word, setWord] = useState(word)
  const [_hypenated, setHypenated] = useState(hypenated)
  const [_ignore, setIgnore] = useState(ignore)
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const [editMode, setEditMode] = useState(isNew ? true : false)
  const [promptIsOpen, setPromptIsOpen] = useState(false)

  return (
    <div className='group/edit grid grid-cols-7 gap-x-2 gap-y-0 items-center hover:bg-gray-100 px-2' onClick={() => setEditMode(true)}>
      {promptIsOpen && (
        <Prompt
          title='Radera avstavningen'
          description='Är du säker på att du vill radera denna avstavning?'
          primaryLabel='Radera'
          secondaryLabel='Avbryt'
          onPrimary={() => {
            (async () => {
              await baboon?.removeHypenation({
                language: 'sv',
                word: _word
              }, session?.accessToken || '')
              handleListHyphenations()
            })().catch(console.error)
            setPromptIsOpen(false)
          }}
          onSecondary={() => {
            setPromptIsOpen(false)
          }}
        />
      )}
      {editMode
        ? (
            <>
              <input
                disabled={!editMode && !isNew}
                type='text'
                value={_word}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditMode(true)
                }}
                onChange={(e) => setWord(e.target.value)}
                className='col-span-2 border border-gray-300 rounded-md px-2 py-1'
              />
              <input
                disabled={!editMode}
                type='text'
                value={_hypenated}
                onChange={(e) => setHypenated(e.target.value)}
                className='col-span-2 border border-gray-300 rounded-md px-2 py-1'
              />
              <label className='col-span-1 flex items-center gap-2'>
                <input type='checkbox' className='w-4 h-4' checked={_ignore} onChange={(e) => setIgnore(e.target.checked)} />
              </label>
              <div className='col-span-2 flex items-end justify-end gap-2'>
                <Button
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    (async () => {
                      await baboon?.setHypenation({
                        language: 'sv',
                        word: _word,
                        hypenated: _hypenated,
                        ignore: _ignore
                      }, session?.accessToken || '')
                      handleListHyphenations()
                      setEditMode(false)
                      setIsNew(false)
                    })().catch(console.error)
                  }}
                >
                  Spara
                </Button>
                {!isNew && (
                  <Button
                    className='bg-red-500 hover:bg-red-400'
                    variant='ghost'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation()
                      setPromptIsOpen(true)
                    }}
                  >
                    <Trash strokeWidth={1.75} size={18} className='text-white' />
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditMode(false)
                    setIsNew(false)
                  }}
                >
                  Avbryt
                </Button>
              </div>
            </>
          )
        : (
            <>
              <div className='text-sm w-full col-span-2'>
                {_word}
              </div>
              <div className='text-sm w-full col-span-2'>
                {_hypenated}
              </div>
              <div className='text-sm w-full col-span-1'>
                {_ignore ? <Check strokeWidth={1.75} size={18} /> : ''}
              </div>
              <div className='invisible group-hover/edit:visible col-span-2 flex items-end justify-end gap-2'>
                <Button variant='ghost' size='sm' onClick={() => setEditMode(true)}>
                  <Pencil strokeWidth={1.75} size={18} />
                </Button>
              </div>
            </>
          )}
    </div>
  )
}

const Dictionary = ({ className }: ViewProps): JSX.Element => {
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
    <View.Root className={cn(className, 'min-h-[900px]')}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          <div className='flex h-full items-center space-x-2 font-bold'>
            <ViewHeader.Title name='dictionary' title='Avstavningar' icon={BookA} iconColor='#006bb3' />
          </div>
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
        <ViewHeader.Action>
        </ViewHeader.Action>
      </ViewHeader.Root>
      <View.Content className='p-2 w-full'>
        <div className='flex flex-col gap-2'>
          <div className='grid grid-cols-7 gap-2 mx-2'>
            <h3 className='font-bold text-sm col-span-2'>
              Ord
            </h3>
            <h3 className='font-bold text-sm col-span-2'>
              Avstavning
            </h3>
            <h3 className='font-bold text-sm col-span-1'>
              Avstava ej
            </h3>
            <h3 className='font-bold text-sm col-span-2'></h3>
          </div>
          <ScrollArea className='h-[calc(100vh-6.2rem)]'>
            <ul className='flex flex-col gap-2'>
              {isNew && <HypenationItem isNew={isNew} setIsNew={setIsNew} word='' hypenated='' ignore={false} handleListHyphenations={() => { void handleListHyphenations() }} />}
              {hyphenations.map((hyphenation) => (
                <HypenationItem key={hyphenation.word} isNew={false} setIsNew={setIsNew} ignore={hyphenation.ignore} word={hyphenation.word} hypenated={hyphenation.hypenated} handleListHyphenations={() => { void handleListHyphenations() }} />
              ))}
            </ul>
          </ScrollArea>
        </div>
      </View.Content>
    </View.Root>
  )
}

export default Dictionary
