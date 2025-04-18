import {
  CircleCheck,
  CircleDot,
  CircleX,
  BadgeCheck,
  type LucideIcon
} from '@ttab/elephant-ui/icons'

interface WorkflowItem {
  title: string
  description: string
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

export const StatusSpecifications: Record<string, StatusSpecification> = {
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
}


export const WorkflowSpecifications: Record<string, WorkflowSpecification> = {
  'core/event': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av denna händelse',
      transitions: {
        done: {
          default: true,
          title: 'Klarmarkera',
          description: 'Markera händelsen som klar'
        },
        approved: {
          title: 'Godkänn',
          description: 'Godkänn händelsen för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera händelsen externt'
        }
      }
    },
    done: {
      title: 'Klar',
      description: 'Händelsen är klar och väntar på godkännande',
      transitions: {
        approved: {
          default: true,
          title: 'Godkänn',
          description: 'Godkänn händelsen för intern användning'
        },
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera händelsen externt'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om händelsen till ett utkast igen'
        }
      }
    },
    approved: {
      title: 'Intern',
      description: 'Händelsen är internt publicerad och går att publicera externt',
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera',
          description: 'Publicera händelsen externt synlig'
        },
        draft: {
          title: 'Till utkast',
          description: 'Gör om händelsen till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Publicerad',
      description: 'Händelsen är publicerad externt',
      transitions: {
        draft: {
          default: true,
          title: 'Till utkast',
          description: 'Gör om händelsen till ett utkast igen'
        },
        cancelled: {
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera händelsen'
        }
      }
    }
  },
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
          description: 'Publicera artikeln direkt'
        },
        withheld: {
          verify: true,
          title: 'Schemalägg publicering',
          description: 'Ange datum och tid för publicering'
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
          description: 'Publicera artikeln'
        },
        withheld: {
          verify: true,
          title: 'Schemalägg publicering',
          description: 'Ange datum och tid för publicering'
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
          verify: true,
          title: 'Ny version',
          description: 'Fortsätt jobba på en ny version av artikeln'
        },
        cancelled: {
          verify: true,
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera artikeln'
        }
      }
    },
    withheld: {
      title: 'Schemalagd',
      description: 'Artikeln är schemalagd för automatisk publicering',
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: 'Publicera direkt',
          description: 'Publicera artikeln direkt'
        },
        draft: {
          verify: true,
          title: 'Till utkast',
          description: 'Avbryt schemalagd publicering och gör om till utkast igen'
        },
        cancelled: {
          verify: true,
          title: 'Dra tillbaka',
          description: 'Avbryt schemalagd publicering och arkivera artikeln'
        }
      }
    }
  },
  'core/factbox': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av faktarutan',
      transitions: {
        usable: {
          verify: true,
          title: 'Publicera',
          description: 'Publicera faktarutan för användning'
        }
      }
    },
    usable: {
      title: 'Användbar',
      description: 'Fakturan är användbar',
      transitions: {
        cancelled: {
          verify: true,
          title: 'Arkivera',
          description: 'Dra tillbaka och arkivera den här faktarutan'
        }
      }
    }
  },
  'core/editorial-info': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av detta till red',
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
      transitions: {
        draft: {
          default: true,
          title: 'Till utkast',
          description: 'Gör om till red till ett utkast igen'
        },
        cancelled: {
          title: 'Dra tillbaka',
          description: 'Avbryt publiceringen och arkivera till red'
        }
      }
    }
  }
}
