import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useAuthors, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef } from 'react'
import { Validation } from './Validation'

export const Byline = ({ onValidation }: {
  onValidation?: (block: string, label: string, value: string | undefined, reason: string) => boolean
}): JSX.Element => {
  const allAuthors = useAuthors().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const path = 'links.core/author'

  const [authors, setAuthors] = useYValue<Block[] | undefined>(path)

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = allAuthors.filter(author =>
    authors?.some(a => a.uuid === author.value))

  return (
    <Awareness name='Section' ref={setFocused} className='flex flex-col gap-2'>
      <ComboBox
        size='xs'
        sortOrder='label'
        options={allAuthors}
        selectedOptions={selectedOptions}
        placeholder={'Lägg till byline'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          if ((authors || [])?.some((a) => a.uuid === option.value)) {
            setAuthors(authors?.filter((a: Block) => {
              return a.uuid !== option.value
            }))
          } else {
            setAuthors([...(authors || []), Block.create({
              type: 'core/author',
              rel: 'author',
              uuid: option.value,
              title: option.label
            })])
          }
        }}
      />
      {onValidation &&
        <Validation
          label='Byline'
          path={path}
          block='core/author'
          onValidation={onValidation}
          />
      }
    </Awareness>
  )
}
