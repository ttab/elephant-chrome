import { useEffect } from 'react'
import { useYMap } from '@/hooks'
import type * as Y from 'yjs'

import { Priorities } from '@/defaults'
import { NewsValueTimeDropDown } from './NewsValueTimeDropDown'
import { NewsValueScoreDropDown } from './NewsValueScoreDropDown'

interface EditorHeaderProps {
  isSynced: boolean
  document?: Y.Doc
}

export const EditorHeader = ({ isSynced, document }: EditorHeaderProps): JSX.Element => {
  const [newsvalueScore, setNewsvalueScore, initNewsvalueScore] = useYMap('core/newsvalue/score')
  const [newsvalueDuration, setNewsvalueDuration, initNewsvalueDuration] = useYMap('core/newsvalue/duration')
  const [newsvalueEnd, setNewsvalueEnd, initNewsvalueEnd] = useYMap('core/newsvalue/end')

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const metaYMap = document.getMap('meta')
    initNewsvalueDuration(metaYMap)
    initNewsvalueScore(metaYMap)
    initNewsvalueEnd(metaYMap)
  }, [
    isSynced,
    document,
    initNewsvalueDuration,
    initNewsvalueScore,
    initNewsvalueEnd
  ])

  return (
    <>
      <NewsValueScoreDropDown
        value={newsvalueScore as string}
        onChange={(value) => {
          setNewsvalueScore(value as number)
        }}
        options={Priorities.map(p => {
          return {
            label: p.label,
            value: p.value,
            icon: p.icon && <p.icon color={p.color} />
          }
        })}
      />

      <NewsValueTimeDropDown
        duration={typeof newsvalueDuration === 'string' ? newsvalueDuration : undefined}
        end={typeof newsvalueEnd === 'string' ? newsvalueEnd : undefined}
        onChange={(setDuration, setEnd) => {
          setNewsvalueDuration(setDuration)
          setNewsvalueEnd(setEnd)
        }}
      />
    </>
  )
}
