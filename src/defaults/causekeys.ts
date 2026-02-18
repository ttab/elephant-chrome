import i18n from '@/lib/i18n'

export const CAUSE_KEYS = {
  development: {
    get short() { return i18n.t('shared:status_menu.causes.development_short') },
    get long() { return i18n.t('shared:status_menu.causes.development_long') }
  },
  correction: {
    get short() { return i18n.t('shared:status_menu.causes.correction_short') },
    get long() { return i18n.t('shared:status_menu.causes.correction_long') }
  },
  retransmission: {
    get short() { return i18n.t('shared:status_menu.causes.retransmission_short') },
    get long() { return i18n.t('shared:status_menu.causes.retransmission_long') }
  },
  fix: {
    get short() { return i18n.t('shared:status_menu.causes.fix_short') },
    get long() { return i18n.t('shared:status_menu.causes.fix_long') }
  }
}
