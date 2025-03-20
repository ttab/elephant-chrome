import { useQuery, useCollaboration, useYjsEditor, useAwareness, useView } from '@/hooks'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import Textbit, { useTextbit } from '@ttab/textbit'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { getValueByYPath } from '@/lib/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { View } from '@/components'
import { FactboxHeader } from './FactboxHeader'
import { Error } from '@/views/Error'
import { useEffect, useRef } from 'react'
import { cn } from '@ttab/elephant-ui/utils'

const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]

const meta: ViewMetadata = {
  name: 'Factbox',
  path: `${import.meta.env.BASE_URL || ''}/factbox`,
  widths: {
    sm: 4,
    md: 4,
    lg: 4,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

const Factbox = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  if (!documentId) {
    return <></>
  }

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={props.document}>
              <FactboxWrapper {...props} documentId={documentId} />
            </AwarenessDocument>
          )
        : (
            <Error
              title='Faktarutedokument saknas'
              message='Inget faktarutedokument är angivet. Navigera tillbaka till översikten och försök igen.'
            />
          )}
    </>
  )
}

const FactboxWrapper = (props: ViewProps & { documentId: string }): JSX.Element => {
  const { provider, synced, user } = useCollaboration()
  const [,setIsFocused] = useAwareness(props.documentId)

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }

    // We only want to rerun when provider change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])


  return (
    <View.Root asDialog={props?.asDialog} className={props?.className}>
      <Textbit.Root
        autoFocus={props.autoFocus ?? true}
        onBlur={() => {
          setIsFocused(false)
        }}
        onFocus={() => {
          setIsFocused(true)
        }}
        plugins={plugins.map((initPlugin) => initPlugin())}
        placeholders='multiple'
        className={cn('h-screen max-h-screen flex flex-col',
          props.asDialog
            ? 'h-full min-h-[600px] max-h-[800px] max-w-full'
            : '')}
      >
        <FactboxContainer
          provider={provider}
          synced={synced}
          user={user}
          documentId={props.documentId}
          asDialog={props.asDialog}
          onDialogClose={props.onDialogClose}
        />
      </Textbit.Root>
    </View.Root>

  )
}


const FactboxContainer = ({
  provider,
  synced,
  user,
  documentId,
  asDialog,
  onDialogClose
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
} & ViewProps): JSX.Element => {
  const { words, characters } = useTextbit()
  const { data: session, status } = useSession()

  const handleSubmit = (): void => {
    if (onDialogClose) {
      onDialogClose(documentId, 'title')
    }

    if (provider && status === 'authenticated') {
      provider.sendStateless(
        createStateless(StatelessType.IN_PROGRESS, {
          state: false,
          id: documentId,
          context: {
            accessToken: session.accessToken,
            user: session.user,
            type: 'Factbox'
          }
        })
      )
    }
  }

  return (
    <>
      <FactboxHeader
        documentId={documentId}
        asDialog={!!asDialog}
        onDialogClose={onDialogClose}
      />

      <View.Content className='flex flex-col max-w-[1000px]'>
        <div className='flex-grow overflow-auto pr-12 max-w-screen-xl'>
          {!!provider && synced
            ? <FactboxContent provider={provider} user={user} />
            : <></>}
        </div>
      </View.Content>

      <View.Footer>
        {asDialog
          ? (
              <Button
                onClick={handleSubmit}
              >
                Skapa faktaruta
              </Button>
            )
          : (
              <>
                <div className='flex gap-2'>
                  <strong>Ord:</strong>
                  <span>{words}</span>
                </div>
                <div className='flex gap-2'>
                  <strong>Tecken:</strong>
                  <span>{characters}</span>
                </div>
              </>
            )}
      </View.Footer>
    </>
  )
}

const FactboxContent = ({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element => {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

  const yjsEditor = useYjsEditor(provider, user)
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  // Handle focus on active state
  useEffect(() => {
    if (isActive && ref?.current?.dataset['state'] !== 'focused') {
      setTimeout(() => {
        ref?.current?.focus()
      }, 0)
    }
  }, [isActive, ref])

  return (
    <>
      <TextBox
        path='root.title'
        placeholder='Rubrik'
        className='font-bold text-lg basis-auto'
        autoFocus={true}
        singleLine={true}
      />

      <Textbit.Editable
        yjsEditor={yjsEditor}
        lang={documentLanguage}
        onSpellcheck={onSpellcheck}
        className='outline-none
          h-full
          dark:text-slate-100
          [&_[data-spelling-error]]:border-b-2
          [&_[data-spelling-error]]:border-dotted
          [&_[data-spelling-error]]:border-red-500
        '
      >
        <DropMarker />
        <Gutter>
          <ContentMenu />
        </Gutter>
        <Toolbar />
        <ContextMenu />
      </Textbit.Editable>
    </>
  )
}

Factbox.meta = meta
export { Factbox }
