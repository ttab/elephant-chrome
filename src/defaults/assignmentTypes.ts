import { type DefaultValueOption } from '@/types'
import {
  FileTextIcon,
  CameraIcon,
  VideoIcon,
  ApertureIcon,
  ZapIcon,
  FileWarningIcon,
  ChartPieIcon,
  BookmarkIcon
} from '@ttab/elephant-ui/icons'
import i18next from 'i18next'
import { isNtb } from '@/shared/getImageSearchProvider'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

const allAssignmentTypes = [
  {
    value: 'text',
    label: i18next.t('shared:assignmentTypes.text'),
    icon: FileTextIcon,
    iconProps
  },
  {
    value: 'flash',
    label: i18next.t('shared:assignmentTypes.flash'),
    icon: ZapIcon,
    iconProps
  },
  {
    value: 'editorial-info',
    label: i18next.t('shared:assignmentTypes.editorial-info'),
    icon: FileWarningIcon,
    iconProps
  },
  {
    value: 'graphic',
    label: i18next.t('shared:assignmentTypes.graphic'),
    icon: ChartPieIcon,
    iconProps
  },
  {
    value: 'picture',
    label: i18next.t('shared:assignmentTypes.picture'),
    icon: CameraIcon,
    iconProps
  },
  {
    value: 'video',
    label: i18next.t('shared:assignmentTypes.video'),
    icon: VideoIcon,
    iconProps
  },
  {
    value: 'picture/video',
    label: i18next.t('shared:assignmentTypes.picture/video'),
    icon: ApertureIcon,
    iconProps
  },
  {
    value: 'timeless',
    label: i18next.t('shared:assignmentTypes.timeless'),
    icon: BookmarkIcon,
    iconProps
  }
]

const ntbAssignmentTypes = [
  {
    value: 'text',
    label: i18next.t('shared:assignmentTypes.text'),
    icon: FileTextIcon,
    iconProps
  },
  {
    value: 'flash',
    label: i18next.t('shared:assignmentTypes.flash'),
    icon: ZapIcon,
    iconProps
  },
  {
    value: 'editorial-info',
    label: i18next.t('shared:assignmentTypes.editorial-info'),
    icon: FileWarningIcon,
    iconProps
  },
  {
    value: 'picture',
    label: i18next.t('shared:assignmentTypes.picture'),
    icon: CameraIcon,
    iconProps
  },
  {
    value: 'video',
    label: i18next.t('shared:assignmentTypes.video'),
    icon: ApertureIcon,
    iconProps
  },
  {
    value: 'live-streaming',
    label: i18next.t('shared:assignmentTypes.live-streaming'),
    icon: VideoIcon,
    iconProps
  },
  {
    value: 'timeless',
    label: i18next.t('shared:assignmentTypes.timeless'),
    icon: BookmarkIcon,
    iconProps
  }
]

export function getAssignmentTypes(): DefaultValueOption[] {
  if (isNtb()) {
    return ntbAssignmentTypes
  }

  return allAssignmentTypes
}

export function isVisualAssignmentType(type: string | null | undefined): boolean {
  return ['picture', 'video', 'graphic'].includes(type || '')
}
