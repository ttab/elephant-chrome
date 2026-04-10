import { Label } from '@ttab/elephant-ui'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { useRegistry } from '@/hooks/useRegistry'
import { useTranslation } from 'react-i18next'
import { ZapIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import type { JSX } from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'

function HastSwitch({ checked, onCheckedChange, size = 'default' }: {
  checked: boolean
  onCheckedChange: () => void
  size?: 'default' | 'lg'
}): JSX.Element {
  const isLg = size === 'lg'

  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={onCheckedChange}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center',
        'rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        'focus-visible:ring-offset-background',
        isLg ? 'h-7 w-12' : 'h-6 w-11',
        checked ? 'bg-red-200 dark:bg-red-900/50' : 'bg-input dark:bg-background'
      )}
    >
      <span
        className={cn(
          'pointer-events-none flex items-center justify-center',
          'rounded-full bg-background shadow-lg ring-0 transition-transform',
          isLg ? 'h-6 w-6' : 'h-5 w-5',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      >
        <ZapIcon
          size={isLg ? 14 : 12}
          strokeWidth={1.75}
          className={cn(
            'transition-colors',
            checked ? 'text-[#FF5050]' : 'text-muted-foreground'
          )}
        />
      </span>
    </button>
  )
}

export const HastToggle = ({ ydoc, usableId, className, variant = 'compact' }: {
  ydoc: YDocument<Y.Map<unknown>>
  usableId?: bigint
  className?: string
  variant?: 'compact' | 'full'
}): JSX.Element | null => {
  const { featureFlags } = useRegistry()
  const { t } = useTranslation()
  const [hast, setHast] = useYValue<Block | undefined>(ydoc.ele, 'meta.ntb/hast[0]')
  const isHast = !!hast && BigInt(hast.value || '0') === (usableId ?? 0n) + 1n

  if (!featureFlags.hasHast) {
    return null
  }

  function handleToggle() {
    if (!isHast) {
      const nextId = (usableId ?? 0n) + 1n
      setHast(Block.create({
        type: 'ntb/hast',
        value: String(nextId)
      }))
    } else {
      setHast(undefined)
    }

    snapshotDocument(ydoc.id, {}, ydoc.provider?.document)
      .catch((error) => {
        toast.error(t('errors:toasts.saveChangeError'))
        console.error('Error snapshotting document after toggling HAST:', error)
      })
  }

  const textColor = isHast ? 'text-foreground' : 'text-muted-foreground'

  if (variant === 'full') {
    return (
      <div className={cn(
        'flex items-center justify-between gap-4 rounded-md border p-3 mt-4 dark:bg-muted',
        isHast ? 'border-foreground' : 'border-muted-foreground',
        className
      )}
      >
        <div className='space-y-0.5'>
          <Label className={cn('text-sm font-semibold', textColor)}>
            {t('flash:sendAsHast')}
          </Label>
          <p className={cn('text-xs', textColor)}>
            {t('flash:sendAsHastDescription')}
          </p>
        </div>
        <HastSwitch checked={isHast} onCheckedChange={handleToggle} />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <HastSwitch checked={isHast} onCheckedChange={handleToggle} size='lg' />
      <Label
        className={cn('text-xs cursor-pointer', textColor)}
        onClick={handleToggle}
      >
        {t('flash:hastLabel')}
      </Label>
    </div>
  )
}
