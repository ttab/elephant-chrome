import type { TBElement, Plugin, TBText } from '@ttab/textbit'
import { FocusBlock } from './FocusBlock'
import { type BaseEditor, Transforms } from 'slate'
import { cn } from '@ttab/elephant-ui/utils'
import { XIcon } from '@ttab/elephant-ui/icons'

export const Figure = ({ editor, children, element }: Plugin.ComponentProps & { editor: BaseEditor, element: TBElement }): JSX.Element => {
  return (
    <FocusBlock className='my-2'>
      <figure
        className="flex gap-1 flex-col my-2 min-h-10 group-data-[state='active']:ring-1 ring-offset-4 rounded-sm relative"
        draggable={false}
      >
        <div contentEditable={false} className='absolute hidden right-1 top-2 size-8 w-fit text-slate-900 justify-between items-center group-hover:block z-50'>
          <div
            className={cn('p-1 rounded opacity-70 bg-slate-200 hover:opacity-100 hover:bg-slate-300')}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const n = editor.children.findIndex((child: TBElement | TBText) => child.id === element.id)

              if (n > -1) {
                Transforms.removeNodes(editor, { at: [n] })
              }
            }}
          >
            <XIcon size={15} />
          </div>
        </div>
        {children}
      </figure>
    </FocusBlock>
  )
}
