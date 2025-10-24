import { ComboBox } from '@ttab/elephant-ui'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Awareness } from './Awareness'
import { useRef } from 'react'
import { useContentSources } from '@/hooks/useContentSources'
import { useYValue } from '@/modules/yjs/hooks'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const ContentSource = ({ ydoc, path }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
}): JSX.Element => {
  const allContentSources = useContentSources().map((_) => {
    return {
      value: _.uri,
      label: _.title
    }
  })


  const setFocused = useRef<(value: boolean, start: string) => void>(() => { })
  const [contentSources, setContentSources] = useYValue<Block[] | undefined>(ydoc.ele, path)
  const selectedOptions = allContentSources.filter((contentSource) =>
    contentSources?.some((cs) => cs.uri === contentSource.value)
  )

  return (
    <Awareness ref={setFocused} ydoc={ydoc} path={path}>
      <ComboBox
        sortOrder='label'
        size='xs'
        modal={true}
        options={allContentSources}
        selectedOptions={selectedOptions}
        placeholder='Lägg till källa'
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(true, (isOpen) ? path : '')
          }
        }}
        onSelect={(option) => {
          if ((contentSources || [])?.some((c) => c.uri === option.value)) {
            setContentSources(contentSources?.filter((c: Block) => {
              return c.uri !== option.value
            }))
          } else {
            setContentSources([...(contentSources || []), Block.create({
              type: 'core/content-source',
              rel: 'source',
              uri: option.value,
              title: option.label
            })])
          }
        }}
      />
    </Awareness>
  )
}
