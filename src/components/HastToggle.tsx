import { Label } from '@ttab/elephant-ui'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { useRegistry } from '@/hooks/useRegistry'
import { useTranslation } from 'react-i18next'
import { ZapIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import { useState, type JSX } from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { Prompt } from '@/components/Prompt'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { mutate } from 'swr'

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
  const hastValue = (() => {
    try {
      return BigInt(hast?.value || '0')
    } catch (ex) {
      console.warn('HastToggle: Failed to parse hast value', {
        documentId: ydoc.id,
        value: hast?.value,
        error: ex
      })
      return 0n
    }
  })()
  // Toggle is "on" only when targeting next version. Unlike HastIndicator.getHastState
  // which also shows active for current usable version, this simpler check works for
  // the toggle because we only enable it for unpublished versions.
  const isHast = !!hast && hastValue === (usableId ?? 0n) + 1n
  const [showPrompt, setShowPrompt] = useState(false)

  if (!featureFlags.hasHast) {
    return null
  }

  async function snapshot() {
    try {
      await snapshotDocument(ydoc.id, {}, ydoc.provider?.document)
      // Invalidate all HastIndicator caches for this document
      void mutate(
        (key) => Array.isArray(key) && key[0] === 'hast-indicator' && key[1] === ydoc.id
      )
    } catch (error) {
      toast.error(t('errors:toasts.saveChangeError'))
      console.error('Error snapshotting document after toggling HAST:', error)
    }
  }

  function toggleOn() {
    try {
      const nextId = (usableId ?? 0n) + 1n
      setHast(Block.create({
        type: 'ntb/hast',
        value: String(nextId)
      }))
      void snapshot()
    } catch (error) {
      toast.error(t('errors:toasts.saveChangeError'))
      console.error('Error toggling HAST on:', error)
    }
  }

  function handleToggle() {
    if (!isHast) {
      toggleOn()
    } else if (variant === 'full') {
      handleRemoveFromVersion()
    } else {
      setShowPrompt(true)
    }
  }

  // Sets hast value to '0' - block remains but is disabled for this version.
  // Can be re-enabled for future versions.
  function handleRemoveFromVersion() {
    try {
      setHast(Block.create({
        type: 'ntb/hast',
        value: '0'
      }))
      void snapshot()
      setShowPrompt(false)
    } catch (error) {
      toast.error(t('errors:toasts.saveChangeError'))
      console.error('Error removing HAST from version:', error)
    }
  }

  // Removes hast block entirely - no hast on any future versions unless re-added.
  function handleRemoveFromArticle() {
    try {
      setHast(undefined)
      void snapshot()
      setShowPrompt(false)
    } catch (error) {
      toast.error(t('errors:toasts.saveChangeError'))
      console.error('Error removing HAST from article:', error)
    }
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
    <>
      <div className={cn('flex items-center gap-1.5', className)}>
        <HastSwitch checked={isHast} onCheckedChange={handleToggle} />
        <Label
          className={cn('text-xs cursor-pointer', textColor)}
          onClick={handleToggle}
        >
          {t('flash:hastLabel')}
        </Label>
      </div>

      {showPrompt && (
        <Prompt
          title={t('flash:removeHast.title')}
          description={t('flash:removeHast.description')}
          primaryLabel={t('flash:removeHast.fromVersion')}
          secondaryLabel={t('flash:removeHast.fromArticle')}
          cancelLabel={t('common:actions.abort')}
          onPrimary={handleRemoveFromVersion}
          onSecondary={handleRemoveFromArticle}
          onCancel={() => setShowPrompt(false)}
        />
      )}
    </>
  )
}
