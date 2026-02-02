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
          <SelectItem value='development'>{t('shared:status_menu.causes.development_short')}</SelectItem>
          <SelectItem value='fix'>{t('shared:status_menu.causes.fix_short')}</SelectItem>
          <SelectItem value='correction'>{t('shared:status_menu.causes.correction_short')}</SelectItem>
          <SelectItem value='retransmission'>{t('shared:status_menu.causes.retransmission_short')}</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
