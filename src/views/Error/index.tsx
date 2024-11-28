import { type ViewMetadata, type ViewProps } from '@/types'
import { View, ViewHeader } from '@/components/View'
import { MessageCircleWarning } from '@ttab/elephant-ui/icons'

const meta: ViewMetadata = {
  name: 'Error',
  path: `${import.meta.env.BASE_URL || ''}/error`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}


export const Error = (props: ViewProps & {
  title?: string
  message?: string
}): JSX.Element => {
  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Ett fel har uppstått!' icon={MessageCircleWarning} />
      </ViewHeader.Root>

      <View.Content className='max-w-[800px] pt-20'>
        <h1 className='text-3xl font-bold mb-6'>{props?.title || 'Okänt fel'}</h1>

        {props?.message
          ? (
              <p className='text-md'>
                {props.message}
              </p>
            )
          : (
              <p className='text-md'>
                Ett okänt fel, eller ett fel som saknar felmeddelande har uppstått. Kontakta systemadministratören.
              </p>
            )}
      </View.Content>
    </View.Root>
  )
}

Error.meta = meta
