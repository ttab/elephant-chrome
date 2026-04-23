import type { JSX } from 'react'
import { Label, Textarea } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'
import { SyntaxHelp } from './SyntaxHelp'
import type { QuerySyntaxState, SearchFieldConfig } from './types'

interface QuerySyntaxModeProps {
  state: QuerySyntaxState
  fields: SearchFieldConfig[]
  onChange: (state: QuerySyntaxState) => void
}

export const QuerySyntaxMode = ({ state, fields, onChange }: QuerySyntaxModeProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs font-medium text-muted-foreground'>
          {t('advancedSearch.query')}
        </Label>
        <Textarea
          autoFocus
          value={state.raw}
          onChange={(e) => onChange({ raw: e.target.value })}
          placeholder={t('advancedSearch.querySyntaxPlaceholder')}
          rows={3}
          className='font-mono text-sm'
        />
      </div>

      <SyntaxHelp fields={fields} />
    </div>
  )
}
