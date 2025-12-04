import { useQuery } from '@/hooks'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { Button } from '@ttab/elephant-ui'
import { useSession } from 'next-auth/react'
import { getValueByYPath } from '@/shared/yUtils'
import { Form, UserMessage, View } from '@/components'
import { FactboxHeader } from './FactboxHeader'
import { Error } from '@/views/Error'
import { useMemo, useState, type JSX } from 'react'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { TextInput } from '@/components/ui/TextInput'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { cn } from '@ttab/elephant-ui/utils'

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

// FIXME: Something is rerendeing this and makes user loose focus
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
      document: props.document || getTemplateFromView('Factbox')(documentId)
    })
  }, [documentId, props.document])

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
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
  const { status } = useSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const environmentIsSane = ydoc.provider && status === 'authenticated'

  const getPlugins = () => {
    const basePlugins = [UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]
    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
      Text({ ...contentMenuLabels })
    ]
  }

  if (!ydoc.provider?.isSynced || !content) {
    return <View.Root />
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        lang={documentLanguage}
        plugins={getPlugins()}
        className={cn(
          'rounded-md border',
          props.asDialog ? 'h-auto min-h-48' : ''
        )}
      >
        <FactboxHeader
          ydoc={ydoc}
          asDialog={!!props.asDialog}
          onDialogClose={props.onDialogClose}
        />

        <View.Content className='flex flex-col max-w-[1000px]'>
          <Form.Root asDialog={props?.asDialog}>
            <Form.Content>
              <Form.Title>
                <TextInput
                  ydoc={ydoc}
                  value={title}
                  autoFocus={!!props.asDialog}
                  className={cn(
                    !props.asDialog ? 'ms-[13px]' : 'ms-6 me-5'
                  )}
                  label='Titel'
                  placeholder='Planeringstitel'
                />
              </Form.Title>
            </Form.Content>
          </Form.Root>

          <div className='flex flex-col gap-4 mb-4'>
            <BaseEditor.Text
              ydoc={ydoc}
              autoFocus={!props.asDialog}
              className={cn(
                props.asDialog ? 'rounded-md border me-[43px] min-h-48' : ''
              )}
            />

            <div className='mx-12'>
              {!environmentIsSane && (
                <UserMessage asDialog={!!props?.asDialog} variant='destructive'>
                  Du är utloggad eller har tappat kontakt med systemet.
                  Vänligen försök logga in igen.
                </UserMessage>
              )}

              {errorMessage && (
                <UserMessage asDialog={!!props?.asDialog} variant='destructive'>
                  {errorMessage}
                </UserMessage>
              )}
            </div>
          </div>
        </View.Content>

        <View.Footer>
          {!props.asDialog
            ? <BaseEditor.Footer />
            : (
                <FactboxDialogFooter
                  ydoc={ydoc}
                  disabled={!environmentIsSane}
                  onError={setErrorMessage}
                  onSuccess={props.onDialogClose}
                />
              )}
        </View.Footer>
      </BaseEditor.Root>
    </View.Root>
  )
}

const FactboxDialogFooter = ({ ydoc, disabled, onSuccess, onError}: {
  ydoc: YDocument<Y.Map<unknown>>
  disabled?: boolean
  onSuccess?: () => void
  onError: (message: string) => void
}) => {
  const [title] = useYValue<string>(ydoc.ele, 'root.title')

  const handleSubmit = (): void => {
    if (disabled) {
      return
    }

    snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
      .then(() => {
        onSuccess?.()
      }).catch((ex) => {
        onError('Det gick inte att skapa ny faktaruta!')
        console.error(ex)
      })
  }

  return (
    <Button
      onClick={handleSubmit}
      disabled={!title || disabled}
      className='whitespace-nowrap'
    >
      Skapa faktaruta
    </Button>
  )
}

Factbox.meta = meta
export { Factbox }
