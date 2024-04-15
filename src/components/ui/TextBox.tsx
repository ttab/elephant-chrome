import { Textbit } from '@ttab/textbit'
import { createEditor } from 'slate'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { useCollaboration, useYObserver } from '@/hooks'
import { useEffect, useMemo } from 'react'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import type * as Y from 'yjs'

export const TextBox = ({ icon, placeholder, base, path, field, className }: {
  path: string
  base: string
  field: string
  icon?: React.ReactNode
  placeholder?: string
  className?: string
}): JSX.Element => {
  const { provider, user } = useCollaboration()
  const { get } = useYObserver(base, path)

  const content = get(field) as Y.XmlText
  return (
    <>
      {!!provider && content &&
        <Textbit.Root
          verbose={true}
          debounce={0}
          placeholder={placeholder}
          plugins={[]}
          className={cn('h-min-12 w-full', className)}
        >
          <TextboxEditable
            content={content}
            provider={provider}
            user={user}
            icon={icon}
          />
        </Textbit.Root>
      }
    </>
  )
}

const TextboxEditable = ({ provider, user, icon, content }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
  icon?: React.ReactNode
  content: Y.XmlText
}): JSX.Element | undefined => {
  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          content
        ),
        provider.awareness,
        { data: user as unknown as Record<string, unknown> }
      )
    )
  }, [provider?.awareness, user, content])

  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])


  const wrapperStyle = cva('absolute top-0 left-0 p-2 -mt-2 -ml-2 text-muted-foreground', {
    variants: {
      hasIcon: {
        true: 'flex flex-row'
      }
    }
  })

  const editableStyle = cva('relative w-full outline-none rounded-sm h-min-12 p-2 -mt-2 -ml-2 ring-offset-background data-[state="focused"]:ring-1 ring-gray-300 data-[state="focused"]:dark:ring-gray-600', {
    variants: {
      hasIcon: {
        true: 'ps-9'
      }
    }
  })

  const hasIcon = !!icon

  return (
    <div>
      <div className={cn(wrapperStyle({ hasIcon }))}>
        {icon}
      </div>

      <Textbit.Editable
        yjsEditor={yjsEditor}
        className={cn(editableStyle({ hasIcon }))}
      />
    </div>
  )
}
