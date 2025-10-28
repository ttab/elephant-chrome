import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useOrganisers } from '@/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef } from 'react'
import { type FormProps } from './Form/Root'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Organiser = ({ ydoc, path, asDialog, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
} & FormProps): JSX.Element => {
  const allOrganisers = useOrganisers().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [organiser, setOrganiser] = useYValue<Block | undefined>(ydoc.ele, path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = (allOrganisers || []).filter((s) => s.value === organiser?.uuid)

  return (
    <Awareness ref={setFocused} ydoc={ydoc} path={path}>
      <ComboBox
        max={1}
        size='xs'
        modal={asDialog}
        options={allOrganisers}
        selectedOptions={selectedOptions}
        placeholder={organiser?.title || 'Lägg till organisatör'}
        onOpenChange={(isOpen: boolean) => {
          setFocused.current(true, (isOpen) ? path : '')
        }}
        onSelect={(option) => {
          onChange?.(true)
          setOrganiser(organiser?.title === option.label
            ? undefined
            : Block.create({
              type: 'core/organiser',
              rel: 'organiser',
              uuid: option.value,
              title: option.label
            })
          )
        }}
      />
    </Awareness>
  )
}
