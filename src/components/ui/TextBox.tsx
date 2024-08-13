import { Textbit } from '@ttab/textbit'
import { createEditor } from 'slate'
import { cn } from '@ttab/elephant-ui/utils'
import { useCollaboration } from '@/hooks'
import { useLayoutEffect, useMemo } from 'react'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import type * as Y from 'yjs'
import { Text } from '@ttab/textbit-plugins'
import { useYValue } from '@/hooks/useYValue'

export const TextBox = ({ icon, placeholder, path, className, singleLine = false, autoFocus = false, onBlur }: {
  path: string
  icon?: React.ReactNode
  placeholder?: string
  className?: string
  singleLine?: boolean
  autoFocus?: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
  const { provider, user } = useCollaboration()
  const [content] = useYValue<Y.XmlText>(path, { observe: false })

  return (
    <>
      {!!provider && content &&
        <Textbit.Root
          verbose={true}
          debounce={0}
          autoFocus={autoFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          plugins={[Text({
            singleLine,
            inputStyle: true,
            styles: ['body']
          })]}
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

  useLayoutEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])
  return (
    <>
      {icon
        ? <div className='flex flex-row'>
          <div className='pt-1.5'>
            {icon}
          </div>

          <div className='grow'>
            <Textbit.Editable
              yjsEditor={yjsEditor}
              className='p-1 py-1.5 -ms-7 ps-11 rounded-sm outline-none ring-offset-background data-[state="focused"]:ring-1 ring-gray-300 data-[state="focused"]:dark:ring-gray-600'
            />
          </div>
        </div>
        : <div>
          <Textbit.Editable
            yjsEditor={yjsEditor}
            className='p-1 py-1.5 -ms-2 ps-2 rounded-sm outline-none ring-offset-background data-[state="focused"]:ring-1 ring-gray-300 data-[state="focused"]:dark:ring-gray-600'
          />
        </div>
      }
    </>
  )
}
