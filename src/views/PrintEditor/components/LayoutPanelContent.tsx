import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { Button, Checkbox, Input } from '@ttab/elephant-ui'
import { EyeIcon, Trash2Icon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'
import { LayoutsSelect } from './LayoutsSelect'
import { Position } from './Position'
import { Additionals } from './Additionals'

export type LayoutPanelContentProps = HTMLAttributes<HTMLDivElement> & {
  panelClassName: string
  ydoc: YDocument<Y.Map<unknown>>
  basePath: string
  layoutUuid: string
  linkTitle?: string
  isSelected: boolean
  onToggleSelection: () => void
  onPreview: () => void
  onRequestDelete: () => void
}

export const LayoutPanelContent = forwardRef<HTMLDivElement, LayoutPanelContentProps>(({
  className,
  panelClassName,
  ydoc,
  basePath,
  layoutUuid,
  linkTitle,
  isSelected,
  onToggleSelection,
  onPreview,
  onRequestDelete,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'border min-h-32 px-2 pb-2 grid grid-cols-12 rounded bg-background dark:bg-slate-900 text-foreground dark:text-slate-100',
      panelClassName,
      'flex-1 w-full',
      className
    )}
    {...props}
  >
    <header className='col-span-12 row-span-1 gap-2 flex items-center justify-between'>
      <div className='flex items-center gap-2' title='Förhandsgranska'>
        <Button
          variant='ghost'
          className='group/render px-2 py-0 flex gap-2 justify-start hover:bg-approved-background/50'
          size='sm'
          onClick={onPreview}
        >
          <EyeIcon strokeWidth={1.75} size={16} />
        </Button>
      </div>
      <div className='flex items-center gap-2'>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
        />
        <Button
          variant='ghost'
          className='p-2'
          onClick={onRequestDelete}
        >
          <Trash2Icon strokeWidth={1.75} size={18} />
        </Button>
      </div>
    </header>

    <div className='col-span-12 row-span-1 mb-1 bg-background'>
      <Input
        type='text'
        readOnly
        placeholder='Namn'
        value={linkTitle}
      />
    </div>
    <div className='col-span-12 row-span-1 mr-1 grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
      <LayoutsSelect
        ydoc={ydoc}
        articleLayoutId={layoutUuid}
        basePath={basePath}
        className='w-full min-w-0'
      />
      <Position
        ydoc={ydoc}
        basePath={basePath}
        className='w-[42px] min-w-[42px] shrink-0'
      />
    </div>
    <Additionals ydoc={ydoc} basePath={basePath} />
  </div>
))

LayoutPanelContent.displayName = 'LayoutPanelContent'
