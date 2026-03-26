import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { Link } from '@/components'
import { useMemo } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const Actions = ({ deliverableUuids, planningId }: { deliverableUuids: string[], planningId: string }): JSX.Element => {
  const { t } = useTranslation('planning')
  return useMemo(() => {
    const items: DotDropdownMenuActionItem[] = [
      {
        label: t('actions.open'),
        item: (
          <Link to='Planning' props={{ id: planningId }}>
            {t('actions.open')}
          </Link>
        )
      },
      {
        label: t('actions.assignments'),
        emptyLabel: t('actions.noDeliverables'),
        item: deliverableUuids.map((uuid) => ({
          label: uuid,
          item: (
            <Link to='Editor' props={{ id: uuid }}>
              {uuid}
            </Link>
          )
        }))
      }
    ]

    return <DotMenu items={items} />
  }, [deliverableUuids, planningId, t])
}
