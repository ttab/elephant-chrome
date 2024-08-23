import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useOrganisations, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { useRef } from 'react'

export const Organisation = (): JSX.Element => {
  const allOrganisations = useOrganisations().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [organisation, setOrganisation] = useYValue<Block | undefined>('links.core/organisation')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOption = allOrganisations.find(s => s.value === organisation?.uuid)

  return (
    <Awareness name='Organisation' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={allOrganisations}
        selectedOption={selectedOption}
        placeholder={organisation?.title || 'Lägg till organisation'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          const newOrganisation = Block.create({
            type: 'core/organisation',
            rel: 'category',
            uuid: option.value,
            title: option.label
          })
          setOrganisation(newOrganisation)
        }}
      />
    </Awareness>
  )
}
