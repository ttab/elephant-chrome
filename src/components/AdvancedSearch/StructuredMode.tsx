import type { JSX } from 'react'
import { Input, Checkbox, Label, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'
import type { FieldPath, StructuredSearchState, SearchFieldConfig } from './types'

interface StructuredModeProps {
  state: StructuredSearchState
  fields: SearchFieldConfig[]
  onChange: (state: StructuredSearchState) => void
}

export const StructuredMode = ({ state, fields, onChange }: StructuredModeProps): JSX.Element => {
  const { t } = useTranslation()

  function updateField(fieldPath: FieldPath, checked: boolean) {
    const next = checked
      ? [...state.selectedFields, fieldPath]
      : state.selectedFields.filter((f) => f !== fieldPath)
    onChange({ ...state, selectedFields: next })
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs font-medium text-muted-foreground'>
          {t('advancedSearch.query')}
        </Label>
        <Input
          autoFocus
          value={state.query}
          onChange={(e) => onChange({ ...state, query: e.target.value })}
          placeholder={t('advancedSearch.searchTerms')}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs font-medium text-muted-foreground'>
          {t('advancedSearch.searchIn')}
        </Label>
        <div className='flex flex-wrap gap-3'>
          {fields.map((field) => (
            <label key={field.fieldPath} className='flex items-center gap-1.5 text-sm'>
              <Checkbox
                checked={state.selectedFields.includes(field.fieldPath)}
                onCheckedChange={(checked) => updateField(field.fieldPath, checked === true)}
              />
              {(t as (k: string) => string)(field.labelKey)}
            </label>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs font-medium text-muted-foreground'>
          {t('advancedSearch.matchType')}
        </Label>
        <ToggleGroup
          type='single'
          value={state.matchType}
          onValueChange={(value) => {
            if (value === 'best_fields' || value === 'phrase') {
              onChange({ ...state, matchType: value })
            }
          }}
          className='justify-start'
        >
          <ToggleGroupItem value='best_fields' className='text-xs'>
            {t('advancedSearch.words')}
          </ToggleGroupItem>
          <ToggleGroupItem value='phrase' className='text-xs'>
            {t('advancedSearch.exactPhrase')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className='flex flex-col gap-2'>
        <label className='flex items-center gap-1.5 text-sm'>
          <Checkbox
            checked={state.booleanAnd}
            onCheckedChange={(checked) => onChange({ ...state, booleanAnd: checked === true })}
          />
          {t('advancedSearch.requireAllTerms')}
        </label>

        <div className='flex items-center gap-3'>
          <label className='flex items-center gap-1.5 text-sm'>
            <Checkbox
              checked={state.fuzzy}
              onCheckedChange={(checked) => onChange({ ...state, fuzzy: checked === true })}
            />
            {t('advancedSearch.fuzzyMatching')}
          </label>
          {state.fuzzy && (
            <ToggleGroup
              type='single'
              value={String(state.fuzzyEdits)}
              onValueChange={(value) => {
                if (value === '1' || value === '2') {
                  onChange({ ...state, fuzzyEdits: Number(value) as 1 | 2 })
                }
              }}
              className='justify-start'
            >
              <ToggleGroupItem value='1' className='text-xs h-7 px-2'>
                {t('advancedSearch.fuzzyEdit1')}
              </ToggleGroupItem>
              <ToggleGroupItem value='2' className='text-xs h-7 px-2'>
                {t('advancedSearch.fuzzyEdit2')}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>
    </div>
  )
}
