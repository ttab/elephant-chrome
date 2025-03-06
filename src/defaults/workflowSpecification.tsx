import { type DefaultValueOption } from '@/types'
import {
  CircleCheck,
  CircleDot,
  CircleX,
  BadgeCheck
} from '@ttab/elephant-ui/icons'

interface WorkflowSpecificationAction {
  title: string
  description: string
  verify?: boolean
}

interface WorkflowSpecificationState extends WorkflowSpecificationAction {
  transitions: Record<string, WorkflowSpecificationAction>
}

type WorkflowSpecificationType = Record<string, Record<string, WorkflowSpecificationState>>


export const StatusSpecification = {
  draft: {
    icon: CircleDot,
    className: 'text-muted-foreground'
  },
  done: {
    icon: CircleCheck,
    className: 'bg-done fill-done rounded-full'
  },
  approved: {
    icon: BadgeCheck,
    className: 'bg-approved fill-approved rounded-full'
  },
  withheld: {
    icon: CircleCheck,
    className: 'bg-withheld fill-withheld rounded-full'
  },
  usable: {
    icon: CircleCheck,
    className: 'bg-usable fill-usable rounded-full'
  },
  cancelled: {
    icon: CircleX,
    className: 'bg-cancelled fill-cancelled rounded-full'
  }
} as const


export const WorkflowSpecification: WorkflowSpecificationType = {
  'core/planning-item': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av denna planering',
      transitions: {
        done: {
          title: 'Klarmarkera',
          description: 'Markera planeringen som klar'
        },
        approved: {
          title: 'Godkänn',
          description: 'Godkänn planeringen för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera planeringen externt synlig'
        }
      }
    },
    done: {
      title: 'Klar',
      description: 'Planeringen väntar på godkännande',
      transitions: {
        approved: {
          title: 'Godkänn',
          description: 'Godkänn planeringen för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera planeringen externt synlig'
        },
        draft: {
          title: 'Gör om till utkast',
          description: 'Gör om planeringen till ett utkast igen'
        }
      }
    },
    approved: {
      title: 'Intern',
      description: 'Planeringen internt publicerad och går att publicera externt',
      transitions: {
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera planeringen externt synlig'
        },
        draft: {
          title: 'Gör om till utkast',
          description: 'Gör om planeringen till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      description: 'Planeringen är publicerad',
      transitions: {
        draft: {
          title: 'Gör om till utkast',
          description: 'Gör om planeringen till ett utkast igen'
        },
        cancelled: {
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera planeringen'
        }
      }
    }
  }
}
