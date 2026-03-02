import { type DefaultValueOption } from '@/types'
import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleXIcon,
  BadgeCheckIcon,
  CircleArrowLeftIcon
} from '@ttab/elephant-ui/icons'
import i18n from 'i18next'

export const DocumentStatuses: DefaultValueOption[] = [
  {
    value: 'usable',
    label: i18n.t('core:status.usable'),
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-usable fill-usable rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'withheld',
    label: i18n.t('core:status.withheld'),
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-withheld fill-withheld rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'done',
    label: i18n.t('core:status.done'),
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-done fill-done rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'approved',
    label: i18n.t('core:status.approved'),
    icon: BadgeCheckIcon,
    iconProps: {
      className: 'bg-approved fill-approved rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'draft',
    label: i18n.t('core:status.draft'),
    icon: CircleDotIcon,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'unpublished',
    label: i18n.t('core:status.unpublished'),
    icon: CircleArrowLeftIcon,
    iconProps: {
      className: 'bg-cancelled fill-cancelled rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  }
] as const

export const PlanningEventStatuses: DefaultValueOption[] = [
  {
    value: 'usable',
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-usable fill-usable rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'withheld',
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-withheld fill-withheld rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'done',
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-done fill-done rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'draft',
    icon: CircleDotIcon,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'unpublished',
    icon: CircleArrowLeftIcon,
    iconProps: {
      className: 'bg-cancelled fill-cancelled rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  }
] as const

export const PrintArticleStatuses: DefaultValueOption[] = [
  {
    label: 'Exporterad',
    value: 'usable',
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-usable fill-usable rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Klar för korr',
    value: 'needs_proofreading',
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-done fill-done rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Godkänd',
    value: 'approved',
    icon: BadgeCheckIcon,
    iconProps: {
      className: 'bg-approved fill-approved rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Inställd',
    value: 'unpublished',
    icon: CircleXIcon,
    iconProps: {
      className: 'bg-cancelled fill-cancelled rounded-full text-white dark:text-black',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Utkast',
    value: 'draft',
    icon: CircleDotIcon,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  }
] as const
