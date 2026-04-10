import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleArrowLeftIcon,
  BadgeCheckIcon,
  CircleXIcon,
  type LucideIcon
} from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

interface WorkflowItem {
  title: string
  asSaveTitle?: string
  asSaveCTA?: string
  description: string
  changedDescription?: string
  updateDescription?: string
  isWorkflow?: boolean
  asSave?: boolean
  requireCause?: boolean
}

export interface WorkflowTransition extends WorkflowItem {
  verify?: boolean
  default?: boolean
}
interface WorkflowState extends WorkflowItem {
  transitions: Record<string, WorkflowTransition>
}

export type WorkflowSpecification = Record<string, WorkflowState>

export interface StatusSpecification {
  icon: LucideIcon
  className: string
}

const baseDeliverable = (type: 'article' | 'flash'): WorkflowSpecification => {
  const typeLabel = type === 'flash' ? 'flashen' : 'artikeln'
  const typeLabelCap = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)

  return {
    draft: {
      title: 'Utkast',
      description: `Du jobbar på ett utkast av ${typeLabel}`,
      isWorkflow: true,
      requireCause: true,
      transitions: {
        done: {
          default: true,
          verify: true,
          title: 'Klarmarkera',
          description: `Markera ${typeLabel} som klar`
        },
        approved: {
          verify: true,
          title: 'Godkänn',
          description: `Godkänn ${typeLabel} för publicering`
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: `Publicera ${typeLabel}`
        },
        withheld: {
          verify: true,
          title: 'Schemalägg publicering',
          description: 'Ange datum och tid för publicering'
        }
      }
    },
    done: {
      title: 'Klar',
      requireCause: true,
      description: `${typeLabelCap} är klar och väntar på godkännande`,
      isWorkflow: true,
      transitions: {
        approved: {
          default: true,
          verify: true,
          title: 'Godkänn',
          description: `Godkänn ${typeLabel} för publicering`
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: `Publicera ${typeLabel} direkt`
        },
        withheld: {
          verify: true,
          title: 'Schemalägg publicering',
          description: 'Ange datum och tid för publicering'
        },
        draft: {
          verify: true,
          title: 'Till utkast',
          description: `Gör om ${typeLabel} till ett utkast igen`
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: `Avbryt och arkivera ${typeLabel}`
        }
      }
    },
    approved: {
      title: 'Godkänd',
      description: `${typeLabelCap} är godkänd att publicera`,
      isWorkflow: true,
      requireCause: true,
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera',
          description: `Publicera ${typeLabel}`
        },
        withheld: {
          verify: true,
          title: 'Schemalägg publicering',
          description: 'Ange datum och tid för publicering'
        },
        draft: {
          verify: true,
          title: 'Till utkast',
          description: `Gör om ${typeLabel} till ett utkast igen`
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: `Avbryt och arkivera ${typeLabel}`
        }
      }
    },
    usable: {
      title: 'Publicerad',
      description: `${typeLabelCap} är publicerad`,
      isWorkflow: true,
      requireCause: true,
      transitions: {
        draft: {
          default: true,
          verify: true,
          title: 'Ny version',
          description: `Fortsätt jobba på en ny version av ${typeLabel}`
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: `Avbryt publiceringen och arkivera ${typeLabel}`
        }
      }
    },
    withheld: {
      title: 'Schemalagd',
      description: `${typeLabelCap} är schemalagd för automatisk publicering`,
      isWorkflow: true,
      requireCause: true,
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera direkt',
          description: `Publicera ${typeLabel} direkt`
        },
        draft: {
          verify: true,
          title: 'Till utkast',
          description: `Avbryt schemalagd publicering och gör om till utkast igen`
        }
      }
    },
    unpublished: {
      title: 'Avpublicerad',
      description: `${typeLabelCap} har avpublicerats`,
      isWorkflow: true,
      requireCause: true,
      transitions: {
        draft: {
          default: true,
          verify: true,
          title: 'Ny version',
          description: `Fortsätt jobba på en ny version av ${typeLabel}`
        }
      }
    }
  }
}

export const getAllStatuses = (): string[] => {
  return [
    'draft',
    'done',
    'approved',
    'withheld',
    'usable',
    'unpublished',
    'print_done',
    'needs_proofreading',
    'cancelled'
  ]
}

export const getStatusSpecifications = (status: string, documentType?: string): StatusSpecification => {
  switch (status) {
    case 'draft':
      return {
        icon: CircleDotIcon,
        className: ''
      }
    case 'done':
      return {
        icon: CircleCheckIcon,
        className: 'bg-done text-white fill-done rounded-full dark:text-black'
      }
    case 'approved':
      return {
        icon: BadgeCheckIcon,
        className: 'bg-approved text-white fill-approved rounded-full dark:text-black'
      }
    case 'withheld':
      return {
        icon: CircleCheckIcon,
        className: 'bg-withheld text-white fill-withheld rounded-full dark:text-black'
      }
    case 'usable':
      return {
        icon: documentType === 'core/factbox' ? BadgeCheckIcon : CircleCheckIcon,
        className: cn(
          'text-white  rounded-full dark:text-black',
          documentType === 'core/factbox' ? 'bg-approved fill-approved' : 'bg-usable fill-usable'
        )
      }
    case 'unpublished':
      return {
        icon: CircleArrowLeftIcon,
        className: 'bg-unpublished text-white fill-unpublished rounded-full dark:text-black'
      }
    case 'print_done':
      return {
        icon: BadgeCheckIcon,
        className: 'bg-approved text-white fill-approved rounded-full dark:text-black'
      }
    case 'needs_proofreading':
      return {
        icon: CircleCheckIcon,
        className: 'bg-done text-white fill-done rounded-full dark:text-black'
      }
    case 'cancelled':
      return {
        icon: CircleXIcon,
        className: 'bg-cancelled text-white fill-cancelled rounded-full dark:text-black'
      }
    default:
      return {
        icon: CircleDotIcon,
        className: ''
      }
  }
}

export const WorkflowSpecifications: Record<string, WorkflowSpecification> = {
  'core/event': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av denna händelse',
      isWorkflow: false,
      asSave: false,
      transitions: {
        done: {
          default: true,
          verify: false,
          title: 'Använd internt',
          description: 'Gör händelsen internt synlig'
        },
        usable: {
          verify: true,
          title: 'Publicera externt',
          description: 'Publicera händelsen externt'
        }
      }
    },
    done: {
      title: 'Intern',
      description: 'Händelsen är internt synlig',
      isWorkflow: false,
      transitions: {
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera händelsen externt'
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avpublicera händelsen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      asSaveCTA: 'Opublicerade ändringar',
      asSaveTitle: 'Publicera ny version',
      description: 'Händelsen är publicerad externt',
      changedDescription: 'Händelsen har ändrats sedan den senaste publiceringen',
      updateDescription: 'Uppdatera den publicerade händelsen med de nya ändringarna',
      isWorkflow: false,
      asSave: true,
      transitions: {
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avpublicera händelsen'
        }
      }
    },
    unpublished: {
      title: 'Avpublicerad',
      description: 'Händelsen har avpublicerats',
      isWorkflow: false,
      transitions: {
        draft: {
          verify: true,
          title: 'Utkast',
          description: 'Gör om händelsen till ett utkast igen'
        }
      }
    }
  },
  'core/planning-item': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av denna planering',
      isWorkflow: false,
      asSave: false,
      transitions: {
        done: {
          default: true,
          verify: false,
          title: 'Använd internt',
          description: 'Gör planeringen internt synlig'
        },
        usable: {
          verify: true,
          title: 'Publicera externt',
          description: 'Publicera planeringen externt'
        }
      }
    },
    done: {
      title: 'Intern',
      description: 'Planeringen är internt synlig',
      isWorkflow: false,
      transitions: {
        usable: {
          title: 'Publicera',
          verify: true,
          description: 'Publicera planeringen externt'
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avpublicera planeringen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      asSaveCTA: 'Opublicerade ändringar',
      asSaveTitle: 'Publicera ändrad version',
      description: 'Planeringen är publicerad',
      changedDescription: 'Planeringen har ändrats sedan den senaste publiceringen',
      updateDescription: 'Uppdatera den publicerade planeringen med de nya ändringarna',
      isWorkflow: false,
      asSave: true,
      transitions: {
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avpublicera planeringen'
        }
      }
    },
    unpublished: {
      title: 'Avpublicerad',
      description: 'Planeringen har avpublicerats',
      isWorkflow: false,
      transitions: {
        draft: {
          verify: true,
          title: 'Utkast',
          description: 'Gör om planeringen till ett utkast igen'
        }
      }
    }
  },
  'core/article': baseDeliverable('article'),
  'core/flash': baseDeliverable('flash'),
  // Factbox workflow needs to be defined
  'core/factbox': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av faktarutan',
      isWorkflow: false,
      transitions: {
        usable: {
          verify: false,
          title: 'Godkänn',
          description: 'Godkänn faktarutan för användning'
        },
        unpublished: {
          verify: false,
          title: 'Kasta',
          description: 'Ta bort faktarutan'
        }
      }
    },
    usable: {
      title: 'Godkänd',
      asSaveCTA: 'Ändrad',
      asSaveTitle: 'Uppdatera',
      updateDescription: 'Godkänn ändringarna',
      description: 'Faktarutan är godkänd',
      isWorkflow: false,
      asSave: true,
      transitions: {
        unpublished: {
          verify: false,
          title: 'Kasta',
          description: 'Ta bort faktarutan'
        }
      }
    },
    unpublished: {
      title: 'Kastad',
      description: 'Faktarutan är inte synlig eller användbar',
      isWorkflow: false,
      transitions: {
        usable: {
          verify: false,
          title: 'Godkänn',
          description: 'Godkänn faktarutan för användning'
        }
      }
    }
  },
  'core/editorial-info': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av detta till red',
      isWorkflow: true,
      transitions: {
        done: {
          default: true,
          title: 'Klarmarkera',
          description: 'Markera till red som klar'
        },
        approved: {
          title: 'Godkänn',
          description: 'Godkänn till red för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera till red externt synlig'
        }
      }
    },
    done: {
      title: 'Klar',
      description: 'Till red är klar och väntar på godkännande',
      isWorkflow: true,
      transitions: {
        approved: {
          default: true,
          title: 'Godkänn',
          description: 'Godkänn till red för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera till red externt synlig'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om till red till ett utkast igen'
        }
      }
    },
    approved: {
      title: 'Intern',
      description: 'Till red är internt publicerad och går att publicera externt',
      isWorkflow: true,
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera',
          description: 'Publicera till red externt synlig'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om till red till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      description: 'Till red är publicerad',
      isWorkflow: true,
      transitions: {
        draft: {
          default: true,
          title: 'Till utkast',
          description: 'Gör om till red till ett utkast igen'
        },
        unpublished: {
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera till red'
        }
      }
    }
  },
  'tt/print-article': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av printartikeln',
      isWorkflow: true,
      transitions: {
        needs_proofreading: {
          default: true,
          title: 'Begär korrläsning',
          description: 'Behöver korrläsning av printartikeln'
        },
        print_done: {
          title: 'Klarmarkera',
          description: 'Markera printartikeln som klar'
        },
        usable: {
          verify: true,
          title: 'Exportera',
          description: 'Exportera printartikeln'
        }
      }
    },
    needs_proofreading: {
      title: 'Klar för korr',
      description: 'Printartikeln behöver korrläsning',
      isWorkflow: true,
      transitions: {
        print_done: {
          title: 'Klarmarkera',
          description: 'Markera printartikeln som klar'
        },
        usable: {
          verify: true,
          title: 'Exportera',
          description: 'Exportera printartikeln'
        },
        cancelled: {
          verify: true,
          title: 'Kasta',
          description: 'Kasta printartikeln'
        },
        draft: {
          verify: true,
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    },
    print_done: {
      title: 'Klar',
      description: 'Printartikeln är klar och väntar på godkännande',
      isWorkflow: true,
      transitions: {
        approved: {
          default: true,
          title: 'Godkänn',
          description: 'Godkänn printartikeln'
        },
        usable: {
          verify: true,
          title: 'Exportera',
          description: 'Exportera printartikeln'
        },
        needs_proofreading: {
          title: 'Begär korrläsning',
          description: 'Behöver korrläsning av printartikeln'
        },
        cancelled: {
          title: 'Kasta',
          description: 'Kasta printartikeln'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Exporterad',
      asSaveCTA: 'Oexporterade ändringar',
      asSaveTitle: 'Exportera ändrad version',
      description: 'Printartikeln är exporterad',
      changedDescription: 'Printartikeln har ändrats sedan den senaste exporten',
      updateDescription: 'Uppdatera den exporterade printartikeln med de nya ändringarna',
      isWorkflow: false,
      asSave: true,
      transitions: {
        unpublished: {
          verify: true,
          title: 'Dra tillbaka',
          description: 'Avbryt export och arkivera printartikeln'
        }
      }
    },
    unpublished: {
      title: 'Inställd',
      description: 'Printartikeln är avpublicerad',
      isWorkflow: true,
      transitions: {
        draft: {
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    },
    cancelled: {
      title: 'Kastad',
      description: 'Printartikeln är kastad',
      isWorkflow: true,
      transitions: {
        draft: {
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    }
  }
}
