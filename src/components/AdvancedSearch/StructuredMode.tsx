import { useState, type JSX } from 'react'
import { Input, Checkbox, Label, ToggleGroup, ToggleGroupItem, Button } from '@ttab/elephant-ui'
import { ChevronDownIcon, ChevronUpIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import type { FieldPath, StructuredSearchState, SearchFieldConfig } from './types'

interface StructuredModeProps {
  state: StructuredSearchState
  fields: SearchFieldConfig[]
  onChange: (state: StructuredSearchState) => void
}

export const StructuredMode = ({ state, fields, onChange }: StructuredModeProps): JSX.Element => {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(
    state.fuzzy || state.boost > 1 || state.fieldExists.length > 0
  )

  function updateField(fieldPath: FieldPath, checked: boolean) {
    const next = checked
      ? [...state.selectedFields, fieldPath]
      : state.selectedFields.filter((f) => f !== fieldPath)
    onChange({ ...state, selectedFields: next })
  }

  function updateFieldExists(field: FieldPath, exists: boolean) {
    const current = state.fieldExists.find((fe) => fe.field === field)
    if (current && current.exists === exists) {
      onChange({ ...state, fieldExists: state.fieldExists.filter((fe) => fe.field !== field) })
    } else {
      const filtered = state.fieldExists.filter((fe) => fe.field !== field)
      onChange({ ...state, fieldExists: [...filtered, { field, exists }] })
    }
  }

  function getFieldExistsValue(field: FieldPath): 'exists' | 'missing' | undefined {
    const fe = state.fieldExists.find((f) => f.field === field)
    if (!fe) return undefined
    return fe.exists ? 'exists' : 'missing'
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* Query — most used */}
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

      {/* Search in fields */}
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

      {/* Date range */}
      <div className='flex flex-col gap-1.5'>
        <Label className='text-xs font-medium text-muted-foreground'>
          {t('advancedSearch.dateRange')}
        </Label>
        <div className='flex items-center gap-2'>
          <Input
            type='date'
            value={state.dateRange.from}
            onChange={(e) => onChange({ ...state, dateRange: { ...state.dateRange, from: e.target.value } })}
            className='flex-1'
          />
          <span className='text-xs text-muted-foreground'>–</span>
          <Input
            type='date'
            value={state.dateRange.to}
            onChange={(e) => onChange({ ...state, dateRange: { ...state.dateRange, to: e.target.value } })}
            className='flex-1'
          />
        </div>
      </div>

      {/* Match type + AND */}
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

      <label className='flex items-center gap-1.5 text-sm'>
        <Checkbox
          checked={state.booleanAnd}
          onCheckedChange={(checked) => onChange({ ...state, booleanAnd: checked === true })}
        />
        {t('advancedSearch.requireAllTerms')}
      </label>

      {/* More options toggle */}
      <Button
        variant='ghost'
        size='xs'
        onClick={() => setShowMore(!showMore)}
        className='flex items-center gap-1 px-0 h-6 text-xs text-muted-foreground justify-start'
      >
        {showMore ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        {t('advancedSearch.moreOptions')}
      </Button>

      {showMore && (
        <div className='flex flex-col gap-4'>
          {/* Fuzzy */}
          <div className='flex flex-col gap-2'>
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
            {state.fuzzy && (
              <div className='flex items-center gap-2 ml-6'>
                <Label className='text-xs text-muted-foreground'>
                  {t('advancedSearch.prefixLength')}
                </Label>
                <Input
                  type='number'
                  min={0}
                  max={5}
                  value={state.fuzzyPrefixLength}
                  onChange={(e) => onChange({ ...state, fuzzyPrefixLength: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })}
                  className='w-16 h-7 text-xs'
                />
              </div>
            )}
          </div>

          {/* Boost */}
          <div className='flex items-center gap-2'>
            <Label className='text-xs text-muted-foreground'>
              {t('advancedSearch.boost')}
            </Label>
            <Input
              type='number'
              min={1}
              max={10}
              step={0.5}
              value={state.boost}
              onChange={(e) => onChange({ ...state, boost: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
              className='w-20 h-7 text-xs'
            />
          </div>

          {/* Field existence */}
          <div className='flex flex-col gap-1.5'>
            <Label className='text-xs font-medium text-muted-foreground'>
              {t('advancedSearch.fieldExists')}
            </Label>
            <div className='flex flex-wrap gap-2'>
              {fields.map((field) => {
                const value = getFieldExistsValue(field.fieldPath)
                return (
                  <div key={field.fieldPath} className='flex items-center gap-1'>
                    <span className='text-xs'>{(t as (k: string) => string)(field.labelKey)}</span>
                    <ToggleGroup
                      type='single'
                      value={value ?? ''}
                      onValueChange={(v) => {
                        if (v === 'exists' || v === 'missing') {
                          updateFieldExists(field.fieldPath, v === 'exists')
                        } else {
                          onChange({ ...state, fieldExists: state.fieldExists.filter((fe) => fe.field !== field.fieldPath) })
                        }
                      }}
                      className='justify-start'
                    >
                      <ToggleGroupItem value='exists' className='text-[10px] h-6 px-1.5'>
                        {t('advancedSearch.exists')}
                      </ToggleGroupItem>
                      <ToggleGroupItem value='missing' className='text-[10px] h-6 px-1.5'>
                        {t('advancedSearch.missing')}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
