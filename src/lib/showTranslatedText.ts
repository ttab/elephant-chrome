import type { TFunction } from 'i18next'

export const showTranslatedText = (slot: string, t: TFunction) => {
  switch (slot) {
    case 'morning':
      return t('core:timeSlots.morning')
    case 'forenoon':
      return t('core:timeSlots.forenoon')
    case 'afternoon':
      return t('core:timeSlots.afternoon')
    case 'evening':
      return t('core:timeSlots.evening')
    default:
      return 'Translation missing'
  }
}
