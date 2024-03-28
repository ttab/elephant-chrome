import { Textbit } from '@ttab/textbit'
import { createEditor } from 'slate'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { useCollaboration } from '@/hooks'
import { useEffect, useMemo } from 'react'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import * as Y from 'yjs'

export const TextBox = ({ name, icon, placeholder }: {
  name: string
  icon?: React.ReactNode
  placeholder?: string
}): JSX.Element => {
  const { provider, synced, user } = useCollaboration()

  return (
    <>
      {!!provider && synced &&
        <Textbit.Root
          verbose={true}
          debounce={0}
          placeholders={false}
          plugins={[]}
          className="h-min-12 w-full"
        >
          <TextboxEditable
            name={name}
            provider={provider}
            user={user}
            icon={icon}
            placeholder={placeholder}
          />
        </Textbit.Root>
      }
    </>
  )
}

const TextboxEditable = ({ name, provider, user, icon, placeholder }: {
  name: string
  provider: HocuspocusProvider
  user: AwarenessUserData
  icon?: React.ReactNode
  placeholder?: string
}): JSX.Element | undefined => {
  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          provider.document.get(name, Y.XmlText)
        ),
        provider.awareness,
        { data: user as unknown as Record<string, unknown> }
      )
    )
  }, [provider?.awareness, provider?.document, user, name])

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

  const placeholderStyle = cva('transition-opacity delay-0 duration-75', {
    variants: {
      showPlaceholder: {
        true: 'opacity-70',
        false: 'opacity-0'
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
        <div className={cn(placeholderStyle({ showPlaceholder: false }))}>
          {placeholder || ''}
        </div>
      </div>

      <Textbit.Editable
        yjsEditor={yjsEditor}
        className={cn(editableStyle({ hasIcon }))}
      />
    </div>
  )
}
