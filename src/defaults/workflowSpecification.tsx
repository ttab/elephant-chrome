import {
  CircleCheck,
  CircleDot,
  CircleX,
  BadgeCheck,
  type LucideIcon
} from '@ttab/elephant-ui/icons'

export interface WorkflowItem {
  title: string
  description: string
}

export interface WorkflowTransition extends WorkflowItem {
  verify?: boolean
  default?: boolean
}
export interface WorkflowState extends WorkflowItem {
  transitions: Record<string, WorkflowTransition>
}

export type WorkflowSpecification = Record<string, WorkflowState>

export interface StatusSpecification {
  icon: LucideIcon
  className: string
}

export const StatusSpecifications = {
  draft: {
    icon: CircleDot,
    className: ''
  },
  done: {
    icon: CircleCheck,
    className: 'bg-done text-white fill-done rounded-full'
  },
  approved: {
    icon: BadgeCheck,
    className: 'bg-approved text-white fill-approved rounded-full'
  },
  withheld: {
    icon: CircleCheck,
    className: 'bg-withheld text-white fill-withheld rounded-full'
  },
  usable: {
    icon: CircleCheck,
    className: 'bg-usable text-white fill-usable rounded-full'
  },
  cancelled: {
    icon: CircleX,
    className: 'bg-cancelled text-white fill-cancelled rounded-full'
  }
} as Record<string, StatusSpecification>


export const WorkflowSpecifications: Record<string, WorkflowSpecification> = {
  'core/planning-item': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av denna planering',
      transitions: {
        done: {
          default: true,
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
      description: 'Planeringen är klar och väntar på godkännande',
      transitions: {
        approved: {
          default: true,
          title: 'Godkänn',
          description: 'Godkänn planeringen för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera planeringen externt synlig'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om planeringen till ett utkast igen'
        }
      }
    },
    approved: {
      title: 'Intern',
      description: 'Planeringen är internt publicerad och går att publicera externt',
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera',
          description: 'Publicera planeringen externt synlig'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om planeringen till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      description: 'Planeringen är publicerad',
      transitions: {
        draft: {
          default: true,
          title: 'Till utkast',
          description: 'Gör om planeringen till ett utkast igen'
        },
        cancelled: {
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera planeringen'
        }
      }
    }
  },
  'core/article': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av artikeln',
      transitions: {
        done: {
          default: true,
          title: 'Klarmarkera',
          description: 'Markera artikeln som klar'
        },
        approved: {
          title: 'Godkänn',
          description: 'Godkänn artikeln för publicering'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera artikeln'
        }
      }
    },
    done: {
      title: 'Klar',
      description: 'Artikeln är klar och väntar på godkännande',
      transitions: {
        approved: {
          default: true,
          title: 'Godkänn',
          description: 'Godkänn artikeln för publicering'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera artiklen direkt'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om artikeln till ett utkast igen'
        }
      }
    },
    approved: {
      title: 'Godkänd',
      description: 'Artikeln är godkänd att publicera',
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera',
          description: 'Publicera artiklen'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om artikeln till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      description: 'Artikeln är publicerad',
      transitions: {
        draft: {
          default: true,
          title: 'Ny version',
          description: 'Fortsätt jobba på en ny version av artikeln'
        },
        cancelled: {
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera artikeln'
        }
      }
    }
  }
}
