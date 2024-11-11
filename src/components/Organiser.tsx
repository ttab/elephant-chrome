import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useOrganisers, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'

import { useRef } from 'react'
import { type FormProps } from './Form/Root'

export const Organiser = ({ asDialog }: FormProps): JSX.Element => {
  const allOrganisers = useOrganisers().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [organiser, setOrganiser] = useYValue<Block | undefined>('links.core/organiser[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = (allOrganisers || []).filter((s) => s.value === organiser?.uuid)

  return (
    <Awareness name='Organiser' ref={setFocused}>
      <ComboBox
        max={1}
        size='xs'
        modal={asDialog}
        options={allOrganisers}
        selectedOptions={selectedOptions}
        placeholder={organiser?.title || 'Lägg till organisatör'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
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
