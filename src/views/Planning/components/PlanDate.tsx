import { DatePicker } from '@/components/Datepicker'
import { useRegistry } from '@/hooks'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { newLocalDate, parseDate } from '@/shared/datetime'
import type * as Y from 'yjs'
import { useState, type JSX } from 'react'
import { MoveDialog } from './MoveDialog'

export const PlanDate = ({ ydoc, asDialog}: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
}): JSX.Element => {
  const [showPrompt, setShowPrompt] = useState<string | undefined>(undefined)
  const { timeZone } = useRegistry()
  const [startString, setStartString] = useYValue<string>(ydoc.ele, 'meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>(ydoc.ele, 'meta.core/planning-item[0].data.end_date')

  const handleSetDate = (date: string) => {
    setStartString(date)
    setEndString(date)
  }

  const handleOnChange = (date: string) => {
    if (!asDialog) {
      setShowPrompt(date)
    } else {
      handleSetDate(date)
    }
  }

  const newDate = newLocalDate(timeZone)
  const date = startString ? parseDate(startString) || newDate : newDate


  return (
    <div>
      <DatePicker
        date={date}
        setDate={handleOnChange}
        resetToday={() => handleOnChange(newDate.toISOString().split('T')[0])}
        forceYear={true}
      />
      {showPrompt && (
        <MoveDialog
          ydoc={ydoc}
          newDate={showPrompt}
          onClose={() => setShowPrompt(undefined)}
        />
      )}
    </div>
  )
}
