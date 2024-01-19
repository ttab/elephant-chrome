import { useYMap } from '@/hooks/useYjsMap'
import { type YMap } from 'node_modules/yjs/dist/src/internals'
import { useEffect } from 'react'
import type * as Y from 'yjs'

interface Props {
  isSynced: boolean
  document?: Y.Doc
}

export const Title = ({ isSynced, document }: Props): JSX.Element => {
  const [description, setDescription, initDescription] = useYMap('core/description/text')


  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const metaYMap: YMap<unknown> = document.getMap('meta')
    console.log(metaYMap)
    initDescription(metaYMap)
  }, [
    isSynced,
    document,
    initDescription
  ])

  console.log(description)
  return (
    <p>{description as string}</p>
  )
}

