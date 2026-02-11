import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { TextbitElement, Node, type Descendant } from '@ttab/textbit'
import { useCallback, type JSX } from 'react'
import { Validation } from '@/components/Validation'
import type { FormProps } from '@/components/Form/Root'
import { getValueByYPath } from '@/shared/yUtils'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { useTranslation } from 'react-i18next'

export const DialogEditor = ({ ydoc, setTitle, onValidation, validateStateRef, type }: {
  ydoc: YDocument<Y.Map<unknown>>
  setTitle: (value: string | undefined) => void
  type: 'article' | 'flash'
} & FormProps): JSX.Element => {
  const plugins = [UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const { t } = useTranslation('flash')

  // Function to handle changes in the editor
  const onChange = useCallback((value: Descendant[]) => {
    const titleNode = value?.find((child) => {
      return TextbitElement.isText(child) && child.properties?.role === 'heading-1'
    })

    if (TextbitElement.isText(titleNode)) {
      setTitle(Node.string(titleNode))
    }
  }, [setTitle])

  if (!content) {
    return <></>
  }

  return (
    <Validation
      ydoc={ydoc}
      label='Rubrik och innehåll'
      path='root.title'
      block='title'
      onValidation={onValidation}
      validateStateRef={validateStateRef}
    >
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        lang={documentLanguage}
        plugins={[
          ...plugins.map((initPlugin) => initPlugin()),
          Text({
            countCharacters: ['heading-1', 'body'],
            preventHotkeys: ['heading-1', 'heading-2', 'preamble'],
            ...contentMenuLabels,
            titleLabel: type === 'flash' ? t('placeholders.flashTitle') : t('editer:title')
          })
        ]}
        className='h-auto min-h-auto rounded-md border'
        onChange={onChange}
      >
        {!!ydoc.provider && ydoc.provider.isSynced
          && (
            <BaseEditor.Text
              ydoc={ydoc}
              allowStyling={false}
              autoFocus={true}
              className='ps-4 pe-4'
            />
          )}
      </BaseEditor.Root>
    </Validation>
  )
}
