import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useAuthors } from '@/hooks'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef, type JSX } from 'react'
import { Validation } from './Validation'
import type { FormProps } from './Form/Root'
import type * as Y from 'yjs'

export const Byline = ({ ydoc, path, onValidation, validateStateRef }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
} & FormProps): JSX.Element => {
  const allAuthors = useAuthors().map((_) => {
    return {
      value: _.id,
      label: _.name
    }
  })

  const [authors, setAuthors] = useYValue<Block[] | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = allAuthors.filter((author) =>
    authors?.some((a) => a.uuid === author.value))

  return (
    <Awareness ref={setFocused} ydoc={ydoc} path={path} className='flex flex-col gap-2'>
      <Validation
        ydoc={ydoc}
        label='Byline'
        path={path}
        block='core/author'
        onValidation={onValidation}
        validateStateRef={validateStateRef}
      >
        <ComboBox
          size='xs'
          sortOrder='label'
          options={allAuthors}
          selectedOptions={selectedOptions}
          placeholder='Lägg till byline'
          onOpenChange={(isOpen: boolean) => {
            setFocused.current(true, (isOpen) ? path : '')
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
      </Validation>
    </Awareness>
  )
}
