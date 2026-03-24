import { useQuery, useRegistry } from '@/hooks'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { useSession } from 'next-auth/react'
import { getValueByYPath } from '@/shared/yUtils'
import { Form, UserMessage, View } from '@/components'
import { FactboxHeader } from './FactboxHeader'
import { Error as ErrorView } from '@/views/Error'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { TextInput } from '@/components/ui/TextInput'
import { cn } from '@ttab/elephant-ui/utils'
import { DocumentHistory } from '@/components/DocumentHistory/DocumentHistory'
import { type DocumentState, getDocumentState } from '@/lib/getDocumentState'
import { Editor as PlainEditor } from '@/components/PlainEditor'


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

const Factbox = (props: ViewProps & { document?: Document }): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id
  // Factbox should be responsible for creating new as well as editing
  const data = useMemo(() => {
    if (!props.document || !documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      subset: [],
      document: props.document || getTemplateFromView('Factbox')(documentId)
    })
  }, [documentId, props.document])

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <ErrorView
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  return (
    <FactboxWrapper {...props} documentId={documentId} data={data} />
  )
}

const FactboxWrapper = (props: ViewProps & { documentId: string, data?: EleDocumentResponse }): JSX.Element => {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const { repository } = useRegistry()
  const { data: session, status } = useSession()
  const [factboxversion, setFactboxVersion] = useState<bigint | undefined>(undefined)
  const [documentState, setDocumentState] = useState<DocumentState | undefined>(undefined)
  const [currentVersion, setCurrentVersion] = useState<bigint | undefined>(undefined)
  const environmentIsSane = ydoc.provider && status === 'authenticated'

  useEffect(() => {
    if (!repository || !session?.accessToken) return
    void repository.getStatuses({
      uuids: [props.documentId],
      statuses: ['usable', 'draft', 'unpublished'],
      accessToken: session.accessToken
    }).then((res) => {
      const item = res?.items[0]
      if (item) {
        setCurrentVersion(item.version)
        setDocumentState(getDocumentState(item))
      }
    })
  }, [repository, session?.accessToken, props.documentId])


  const configuredPlugins = useMemo(() => {
    return [
      UnorderedList(),
      OrderedList(),
      Bold(),
      Italic(),
      LocalizedQuotationMarks(),
      Text({ ...contentMenuLabels })
    ]
  }, [])

  const isOldVersion = factboxversion !== undefined && factboxversion !== currentVersion

  if (!ydoc.provider?.isSynced || !content) {
    return <View.Root />
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <FactboxHeader
        ydoc={ydoc}
        onDialogClose={props.onDialogClose}
        asDialog={!!props?.asDialog}
      />

      <div className='mx-12 border mt-2 py-1.5 px-3 rounded'>
        <DocumentHistory
          uuid={props.documentId}
          currentVersion={currentVersion}
          documentState={documentState}
          onSelectVersion={setFactboxVersion}
          selectedVersion={factboxversion}
          withStatusOnly={true}
          documentType='core/factbox'
        />
      </div>

      {isOldVersion
        ? (
            <View.Content className='flex flex-col max-w-[1000px] pt-8' variant='grid'>
              <PlainEditor
                key={factboxversion.toString()}
                id={props.documentId}
                version={factboxversion}
                direct
                showTitle
              />
            </View.Content>
          )
        : (
            <BaseEditor.Root
              ydoc={ydoc}
              content={content}
              lang={documentLanguage}
              plugins={configuredPlugins}
            >
              <View.Content className='flex flex-col max-w-[1000px]'>
                <Form.Root asDialog={props?.asDialog}>
                  <Form.Content>
                    <Form.Title>
                      <TextInput
                        ydoc={ydoc}
                        value={title}
                        className={cn(
                          !props.asDialog ? 'ms-[13px]' : 'ms-6 me-5'
                        )}
                        label='Rubrik'
                        placeholder='Rubrik'
                        autoFocus='end'
                      />
                    </Form.Title>
                  </Form.Content>
                </Form.Root>

                <div className='flex flex-col gap-4 mb-4 grow'>
                  <BaseEditor.Text
                    ydoc={ydoc}
                    editorType='factbox'
                  />

                  <div className='mx-12'>
                    {!environmentIsSane && (
                      <UserMessage asDialog={!!props?.asDialog} variant='destructive'>
                        Du är utloggad eller har tappat kontakt med systemet.
                        Vänligen försök logga in igen.
                      </UserMessage>
                    )}
                  </div>
                </div>
              </View.Content>

              <View.Footer>
                <BaseEditor.Footer />
              </View.Footer>
            </BaseEditor.Root>
          )}
    </View.Root>
  )
}

Factbox.meta = meta
export { Factbox }
