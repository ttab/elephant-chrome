import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'

export const PromptCauseField = ({ onValueChange, cause }: {
  onValueChange: (value: string) => void
  cause?: string | undefined
}) => {
  const { t } = useTranslation()

  return (
    <>
      <Label htmlFor='StatusCause'>{t('shared:status_menu.cause')}</Label>
      <Select onValueChange={onValueChange} name='StatusCause' defaultValue={cause && cause}>
        <SelectTrigger>
          <SelectValue placeholder={t('shared:status_menu.pickCause')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='development'>UV</SelectItem>
          <SelectItem value='fix'>KORR</SelectItem>
          <SelectItem value='correction'>RÄ</SelectItem>
          <SelectItem value='retransmission'>OMS</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
