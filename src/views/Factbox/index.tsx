import { useQuery, useYjsEditor, useView } from '@/hooks'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import Textbit, { useTextbit } from '@ttab/textbit'
import { Button } from '@ttab/elephant-ui'
import { useSession } from 'next-auth/react'
import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { Form, View } from '@/components'
import { FactboxHeader } from './FactboxHeader'
import { Error } from '@/views/Error'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { FormProps } from '@/components/Form/Root'
import { toast } from 'sonner'
import { InfoIcon } from '@ttab/elephant-ui/icons'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { TextInput } from '@/components/ui/TextInput'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'

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

  // Factbox should be responsible for creating new as well as editing
  const data = useMemo(() => {
    if (!props.document || !documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: getTemplateFromView('Factbox')(documentId)
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

  const getPlugins = () => {
    const basePlugins = [UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]
    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
      Text({ ...contentMenuLabels })
    ]
  }


  return (
    <View.Root asDialog={props?.asDialog} className={props?.className}>
      <Textbit.Root
        debounce={0}
        autoFocus={props.autoFocus ?? true}
        plugins={getPlugins()}
        placeholders='multiple'
        className={cn('h-screen max-h-screen flex flex-col',
          props.asDialog
            ? 'h-full min-h-[600px] max-h-[800px] max-w-full'
            : '')}
      >
        <FactboxContainer
          ydoc={ydoc}
          asDialog={props.asDialog}
          onDialogClose={props.onDialogClose}
        />
      </Textbit.Root>
    </View.Root>

  )
}


const FactboxContainer = ({
  ydoc,
  asDialog,
  onDialogClose
}: {
  ydoc: YDocument<Y.Map<unknown>>
} & ViewProps): JSX.Element => {
  const { stats } = useTextbit()
  const { status } = useSession()
  const [title] = useYValue<boolean>(ydoc.ele, 'root.title')

  const handleSubmit = (): void => {
    if (ydoc.provider && status === 'authenticated') {
      snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
        .then(() => {
          if (onDialogClose) {
            onDialogClose()
          }
        }).catch((ex) => {
          toast.error('Kunde inte skapa ny faktaruta!', {
            duration: 5000,
            position: 'top-center'
          })
          console.error(ex)
        })
    }
  }

  const environmentIsSane = ydoc.provider && status === 'authenticated'

  return (
    <>
      <FactboxHeader
        ydoc={ydoc}
        asDialog={!!asDialog}
        onDialogClose={onDialogClose}
      />

      <View.Content className='flex flex-col max-w-[1000px]'>
        <div className='grow overflow-auto pt-2 pr-12 max-w-(--breakpoint-xl)'>
          {!!ydoc.provider && ydoc.provider.isSynced
            ? (
                <FactboxContent ydoc={ydoc} />
              )
            : <></>}
        </div>
      </View.Content>

      <View.Footer>
        {asDialog
          ? (
              <>
                {!environmentIsSane && (
                  <div className='text-sm leading-tight pb-2 text-left flex gap-2'>
                    <span className='w-4'>
                      <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
                    </span>
                    <p>
                      Du är utloggad eller har tappat kontakt med systemet.
                      Vänligen försök logga in igen.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!title || !environmentIsSane}
                  className='whitespace-nowrap'
                >
                  Skapa faktaruta
                </Button>
              </>
            )
          : (
              <>
                <div className='flex gap-2'>
                  <strong>Ord:</strong>
                  <span title='Antal ord totalt'>{stats.full.words}</span>
                </div>
                <div className='flex gap-2'>
                  <strong>Tecken:</strong>
                  <span title='Antal tecken totalt'>{stats.full.characters}</span>
                </div>
              </>
            )}
      </View.Footer>
    </>
  )
}

const FactboxContent = ({ ydoc, asDialog }: {
  ydoc: YDocument<Y.Map<unknown>>
  onChange?: (value: boolean) => void
} & FormProps): JSX.Element => {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')

  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)

  const yjsEditor = useYjsEditor(ydoc)
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
      <Form.Root
        asDialog={asDialog}
        className='[&_[role="textbox"]:focus]:bg-white [&_[role="textbox"]]:ring-transparent [&_[role="textbox"]:focus]:ring-gray-200'
      >
        <Form.Content>
          <TextInput
            ydoc={ydoc}
            value={title}
            label='Titel'
            // autoFocus={!!props.asDialog}
            placeholder='Planeringstitel'
          />

        </Form.Content>
      </Form.Root>
      <Textbit.Editable
        yjsEditor={yjsEditor}
        lang={documentLanguage}
        onSpellcheck={onSpellcheck}
        className='outline-none
          my-1
          h-full
          dark:text-slate-100
          **:data-spelling-error:border-b-2
          **:data-spelling-error:border-dotted
          **:data-spelling-error:border-red-500'
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
