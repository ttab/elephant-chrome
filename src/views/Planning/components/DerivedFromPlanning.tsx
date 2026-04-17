import { Link } from '@/components/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Separator } from '@ttab/elephant-ui'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'

export const DerivedFromPlanning = ({
  plannings = []
}: {
  plannings: Block[] | undefined
}) => {
  const { t } = useTranslation()
  const source = plannings?.find((block) => block.rel === 'derived-from')

  if (!source) {
    return <></>
  }

  return (
    <>
      <Separator />
      <div className='pl-6'>
        <div className='flex items-center gap-2'>
          <CalendarDaysIcon
            strokeWidth={1.75}
            size={18}
            className='text-muted-foreground'
          />
          <div className='text-muted-foreground py-2'>
            {t('planning:related.derivedFromPlanning')}
          </div>
        </div>
        <div>
          <Link
            to='Planning'
            props={{ id: source.uuid }}
            target='last'
            key={source.uuid}
            className='w-fit text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-table-focused p-1 rounded-sm'
          >
            {source.title || source.uuid}
          </Link>
        </div>
      </div>
    </>
  )
}
