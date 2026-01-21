import { Select, SelectContent, SelectItem, SelectTrigger } from '@ttab/elephant-ui'
import { type JSX } from 'react'
import { useTranslation } from 'react-i18next'


export const LanguageSelector = (): JSX.Element => {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'sv-SE', label: 'Svenska' },
    { code: 'no', label: 'Norsk bokmål' }
  ]

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value).then(() => {
    }).catch((err) => {
      console.error('Error changing language:', err)
    })
  }

  return (
    <Select
      value={i18n.language}
      onValueChange={changeLanguage}
    >
      <SelectTrigger className='gap-1 w-fit justify-between border-none focus:ring-0'>
        {i18n.language}
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
