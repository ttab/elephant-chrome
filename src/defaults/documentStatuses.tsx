import { type DefaultValueOption } from '@/types'
import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleXIcon,
  BadgeCheckIcon,
  CircleArrowLeftIcon
} from '@ttab/elephant-ui/icons'

export const DocumentStatuses: DefaultValueOption[] = [
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
    value: 'approved',
    icon: BadgeCheckIcon,
    iconProps: {
      className: 'bg-approved fill-approved rounded-full text-white dark:text-black',
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
