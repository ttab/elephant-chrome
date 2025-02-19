import { useQuery, useCollaboration, useYValue, useYjsEditor } from '@/hooks'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import { ViewHeader } from '@/components/View'
import { BookTextIcon, InfoIcon } from '@ttab/elephant-ui/icons'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import Textbit, { useTextbit } from '@ttab/textbit'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { useState } from 'react'
import { TextBox } from '@/components/ui'
import { Alert, AlertDescription, Button } from '@ttab/elephant-ui'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { createDocument } from '@/lib/createYItem'
import { factboxDocumentTemplate } from '@/defaults/templates/factboxDocumentTemplate'
import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { getValueByYPath } from '@/lib/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'

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
  const [query] = useQuery()
  const [document, setDocument] = useState<Y.Doc>()
  const documentId = props.id || query.id

  if (!documentId) {
    return <></>
  }

  if (props.onDocumentCreated && !document) {
    const [, doc] = createDocument({
      template: (id) => factboxDocumentTemplate(id),
      inProgress: true
    })
    setDocument(doc)
  }

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={document} className='h-full'>
              <Wrapper {...props} documentId={documentId} />
            </AwarenessDocument>
          )
        : <></>}
    </>
  )
}

function Wrapper(props: ViewProps & { documentId: string }): JSX.Element {
  const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]
  const {
    provider,
    synced,
    user
  } = useCollaboration()
  const { data: session, status } = useSession()
  const [isSaved, setSaved] = useState(false)
  const [inProgress] = useYValue('root.__inProgress')

  return (
    <>
      <Textbit.Root plugins={plugins.map((initPlugin) => initPlugin())} placeholders='multiple' className='h-screen max-h-screen flex flex-col'>
        <ViewHeader.Root>
          <ViewHeader.Title title='Faktaruta' icon={BookTextIcon} />

          <ViewHeader.Action>
            {!!props.documentId
            && <ViewHeader.RemoteUsers documentId={props.documentId} />}
          </ViewHeader.Action>

        </ViewHeader.Root>
        <div className='flex-grow overflow-auto pr-12 max-w-screen-xl'>
          {!!provider && synced
            ? (
                <>
                  {!inProgress && !isSaved && (
                    <div className='p-4'>
                      <Alert className='bg-gray-50' variant='destructive'>
                        <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
                        <AlertDescription>
                          <>Du redigerar nu faktarutans original.</>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  <EditorContent provider={provider} user={user} />
                </>
              )
            : <></>}
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
                  }}
                >
                  Spara
                </Button>
              )
            : null}
        </div>
        <div className='h-14 basis-14'>
          <Footer />
        </div>
      </Textbit.Root>
    </>

  )
}


function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')
  const yjsEditor = useYjsEditor(provider, user)
  const onSpellcheck = useOnSpellcheck(documentLanguage)

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
    </div>
  )
}

function Footer(): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <footer className='flex line font-sans h-14 border-t text-sm p-3 pr-8 text-right gap-4 justify-end items-center'>
      <div className='flex gap-2'>
        <strong>Ord:</strong>
        <span>{words}</span>
      </div>
      <div className='flex gap-2'>
        <strong>Tecken:</strong>
        <span>{characters}</span>
      </div>
    </footer>
  )
}

Factbox.meta = meta
