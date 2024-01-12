import { useEffect } from 'react'
import { useYMap } from '@/hooks/useYjsMap'
import type * as Y from 'yjs'

// FIXME: Needs refactoring into a more global settings file
import { Priorities } from '@/defaults'
import { NewsValueTimeDropDown } from './Toolbar/NewsValueTimeDropDown'
import { NewsValueScoreDropDown } from './Toolbar/NewsValueScoreDropDown'

interface ToolbarProps {
  isSynced: boolean
  document?: Y.Doc
}

export const Toolbar = ({ isSynced, document }: ToolbarProps): JSX.Element => {
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
            icon: <p.icon color={p.color} />
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
