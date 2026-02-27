import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import type { YDocument } from '@/modules/yjs/hooks'
import { Textbit, useTextbit, type TBPluginDefinition, type Descendant } from '@ttab/textbit'
import type * as Y from 'yjs'
import { ContextMenu } from './ContextMenu'
import { Toolbar } from './Toolbar'
import { ContentMenu } from './ContentMenu'
import { DropMarker } from './DropMarker'
import { Gutter } from './Gutter'
import { cn } from '@ttab/elephant-ui/utils'
import { useView } from '@/hooks/useView'
import { useEffect, useRef } from 'react'


const EditorRoot = (props: {
  ydoc: YDocument<Y.Map<unknown>>
  readOnly?: boolean
  plugins?: TBPluginDefinition[]
  content: Y.XmlText
  onChange?: (value: Descendant[]) => void
  lang?: string
  className?: string
  children?: React.ReactNode
}) => {
  const onSpellcheck = useOnSpellcheck(props.lang)

  return (
    <Textbit.Root
      value={props.content}
      awareness={props.ydoc.provider?.awareness}
      cursor={{
        dataField: 'data',
        data: props.ydoc.user as Record<string, unknown>
      }}
      readOnly={!!props.readOnly}
      onSpellcheck={onSpellcheck}
      plugins={props.plugins}
      placeholders='multiple'
      className={cn('h-screen max-h-screen flex flex-col', props.className)}
      lang={props.lang}
      onChange={props.onChange}
    >
      {props.children}
    </Textbit.Root>
  )
}


const EditorText = (props: {
  ydoc: YDocument<Y.Map<unknown>>
  autoFocus?: boolean
  className?: string
  allowStyling?: boolean
  'aria-label'?: string
}) => {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)

  // Handle focus on active state
  useEffect(() => {
    if (isActive && ref?.current?.dataset['state'] !== 'focused') {
      setTimeout(() => {
        ref?.current?.focus()
      }, 0)
    }
  }, [isActive, ref])

  if (!props.ydoc.provider || !props.ydoc.provider.isSynced) {
    return null
  }

  return (
    <Textbit.Editable
      aria-label={props['aria-label']}
      autoFocus={props.autoFocus === true && isActive}
      className={cn(`outline-none
          pt-4
          pb-4
          ps-2
          dark:text-slate-100
          **:data-spelling-error:border-b-2
          **:data-spelling-error:border-dotted
          **:data-spelling-error:border-red-500
          grow
          pr-12
          max-w-(--breakpoint-xl)`,
      props.allowStyling !== false ? 'ms-12 pe-12' : 'ps-14 pe-12',
      props.className)}
    >
      {props.allowStyling !== false
        && (
          <>
            <DropMarker />
            <Gutter>
              <ContentMenu />
            </Gutter>
            <Toolbar />
          </>
        )}
      <ContextMenu />
    </Textbit.Editable>
  )
}

const EditorFooter = () => {
  const { stats } = useTextbit()

  return (
    <>
      <div className='flex gap-2'>
        <strong>Ord:</strong>
        <span title='Antal ord: artikel (totalt)'>{`${stats.short.words} (${stats.full.words})`}</span>
      </div>
      <div className='flex gap-2'>
        <strong>Tecken:</strong>
        <span title='Antal tecken: artikel (totalt)'>{`${stats.short.characters} (${stats.full.characters})`}</span>
      </div>
    </>
  )
}
export const BaseEditor = {
  Root: EditorRoot,
  Text: EditorText,
  Footer: EditorFooter
}
