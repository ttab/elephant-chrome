import { Textbit } from '@ttab/textbit'
import { createEditor } from 'slate'
import { cn } from '@ttab/elephant-ui/utils'
import { useCollaboration, useRegistry, useSupportedLanguages } from '@/hooks'
import { useLayoutEffect, useMemo } from 'react'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import type * as Y from 'yjs'
import { Text } from '@ttab/textbit-plugins'
import { useYValue } from '@/hooks/useYValue'
import { useSession } from 'next-auth/react'
import { ContextMenu } from '../Editor/ContextMenu'
import { getValueByYPath } from '@/lib/yUtils'

export const TextBox = ({
  icon,
  placeholder,
  path,
  className,
  singleLine = false,
  countCharacters = false,
  autoFocus = false,
  spellcheck = true,
  onBlur,
  onFocus
}: {
  path: string
  icon?: React.ReactNode
  placeholder?: string
  className?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
  const { provider, user } = useCollaboration()
  // FIXME: We need to check that the path exists. If not we need to create the missing Block
  const [content] = useYValue<Y.XmlText>(path, true)

  if (!provider?.document) {
    return <></>
  }

  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

  if (content === undefined) {
    // Empty placeholder while waiting for data
    return (
      <div className={cn('h-10 w-full flex flex-row', className)}>
        <div className='pt-1.5'>
          {icon}
        </div>
      </div>
    )
  }

  return (
    <>
      {!!provider && content
      && (
        <Textbit.Root
          verbose={true}
          debounce={0}
          autoFocus={autoFocus}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          plugins={[Text({
            singleLine,
            countCharacters,
            inputStyle: true,
            styles: ['body']
          })]}
          className={cn('h-min-2 w-full', className)}
        >
          <TextboxEditable
            content={content}
            provider={provider}
            singleLine={singleLine}
            user={user}
            icon={icon}
            documentLanguage={documentLanguage}
            spellcheck={spellcheck}
          />
        </Textbit.Root>
      )}
    </>
  )
}

const TextboxEditable = ({ provider, user, icon: Icon, content, singleLine, documentLanguage, spellcheck }: {
  provider: HocuspocusProvider
  singleLine: boolean
  user: AwarenessUserData
  icon?: React.ReactNode
  content: Y.XmlText
  documentLanguage: string | undefined
  spellcheck?: boolean
}): JSX.Element | undefined => {
  const { data: session } = useSession()
  const { spellchecker } = useRegistry()
  const supportedLanguages = useSupportedLanguages()

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
    <div className='flex flex-col space-y-2'>
      <div className='flex space-x-2'>
        {Icon && (
          <div className='pt-1.5'>
            {Icon}
          </div>
        )}
        <div className='flex-grow'>
          <Textbit.Editable
            yjsEditor={yjsEditor}
            onSpellcheck={async (texts) => {
              if (documentLanguage && spellcheck) {
                const spellingResult = await spellchecker?.check(texts.map(({ text }) => text), documentLanguage, supportedLanguages, session?.accessToken ?? '')
                if (spellingResult) {
                  return spellingResult
                }
              }
              return []
            }}
            className={cn(!singleLine && '!min-h-20',
              `p-1
               py-1.5
               ps-2
               rounded-md
               outline-none
               ring-offset-background
               focus:ring-1
               ring-input
               focus:dark:ring-gray-600
               whitespace-nowrap
               [&_[data-spelling-error]]:border-b-2
               [&_[data-spelling-error]]:border-dotted
               [&_[data-spelling-error]]:border-red-500
               dark:bg-input`
            )}
          >
            <ContextMenu className='z-[9999]' />
          </Textbit.Editable>
        </div>
      </div>
    </div>
  )
}
