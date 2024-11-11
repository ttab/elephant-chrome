import { useQuery, useCollaboration, useYValue, useRegistry } from '@/hooks'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import { ViewHeader } from '@/components/View'
import { BookTextIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList } from '@ttab/textbit-plugins'
import Textbit, { useTextbit } from '@ttab/textbit'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { useEffect, useMemo, useState } from 'react'
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core'
import { createEditor } from 'slate'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { createDocument } from '@/lib/createYItem'
import { factboxDocumentTemplate } from '@/defaults/templates/factboxDocumentTemplate'
import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'
import { ContextMenu } from '@/components/Editor/ContextMenu'

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

export const Factbox = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const query = useQuery()
  const [document, setDocument] = useState<Y.Doc>()
  const documentId = props.id || query.id

  if (!documentId) {
    return <></>
  }

  if (props.onDocumentCreated && !document) {
    const [, doc] = createDocument((id) => factboxDocumentTemplate(id), true)
    setDocument(doc)
  }

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={document} className='h-full'>
          <Wrapper {...props} documentId={documentId} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

function Wrapper(props: ViewProps & { documentId: string }): JSX.Element {
  const plugins = [Text, UnorderedList, OrderedList, Bold, Italic]
  const {
    provider,
    synced,
    user
  } = useCollaboration()
  const { data: session, status } = useSession()
  const [isSaved, setSaved] = useState(false)
  const [inProgress] = useYValue('root.__inProgress')

  return (
    <Textbit.Root plugins={plugins.map(initPlugin => initPlugin())} placeholders="multiple" className="h-screen max-h-screen flex flex-col">
      <ViewHeader.Root>
        <ViewHeader.Title title='Faktaruta' icon={BookTextIcon} />

        <ViewHeader.Action>
          {!!props.documentId &&
            <ViewHeader.RemoteUsers documentId={props.documentId} />
          }
        </ViewHeader.Action>

      </ViewHeader.Root>

      <div className="flex-grow overflow-auto pr-12 max-w-screen-xl">
        {!!provider && synced
          ? <EditorContent provider={provider} user={user} />
          : <></>
        }
      </div>
      <div className='p-2'>
        {inProgress || isSaved
          ? (
            <Button
              disabled={isSaved}
              onClick={() => {
                if (provider && status === 'authenticated') {
                  provider.sendStateless(
                    createStateless(StatelessType.IN_PROGRESS, {
                      state: false,
                      id: props.documentId,
                      context: {
                        accessToken: session.accessToken,
                        user: session.user,
                        type: 'Factbox'
                      }
                    }))
                }
                setSaved(true)
              }}>Spara
            </Button>)
          : null}
      </div>
      <div className="h-14 basis-14">
        <Footer />
      </div>
    </Textbit.Root>
  )
}


function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { data: session } = useSession()
  const { spellchecker, locale } = useRegistry()

  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }
    const content = provider.document.getMap('ele').get('content') as YXmlText

    if (!content) {
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
  }, [provider, user])

  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <div className='w-full'>
      <TextBox
        path='root.title'
        placeholder='Rubrik'
        className='pl-4 font-bold text-lg basis-full w-full'
        autoFocus={true}
        singleLine={true}
      />
      <Textbit.Editable
        yjsEditor={yjsEditor}
        onSpellcheck={async (texts) => {
          return await spellchecker?.check(texts, locale, session?.accessToken ?? '') ?? []
        }}
        className="outline-none
          h-full
          dark:text-slate-100
          [&_[data-spelling-error]]:border-b-2
          [&_[data-spelling-error]]:border-dotted
          [&_[data-spelling-error]]:border-red-500
        "
      >
        <DropMarker />

        <Gutter>
          <ContentMenu />
        </Gutter>

        <Toolbar />
        <ContextMenu />
      </Textbit.Editable>
    </div>
  )
}

function Footer(): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <footer className="flex line font-sans h-14 border-t text-sm p-3 pr-8 text-right gap-4 justify-end items-center">
      <div className="flex gap-2">
        <strong>Ord:</strong>
        <span>{words}</span>
      </div>
      <div className="flex gap-2">
        <strong>Tecken:</strong>
        <span>{characters}</span>
      </div>
    </footer>
  )
}

Factbox.meta = meta
