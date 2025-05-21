import {
  CircleCheck,
  CircleDot,
  CircleArrowLeft,
  BadgeCheck,
  type LucideIcon,
  CircleX
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
  unpublished: {
    icon: CircleArrowLeft,
    className: 'bg-unpublished text-white fill-unpublished rounded-full'
  },
  print_done: {
    icon: BadgeCheck,
    className: 'bg-approved text-white fill-approved rounded-full'
  },
  needs_proofreading: {
    icon: CircleCheck,
    className: 'bg-done text-white fill-done rounded-full'
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
      description: 'Händelsen är publicerad externt',
      transitions: {
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avpublicera händelsen externt'
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
      transitions: {
        usable: {
          verify: true,
          title: 'Publicera',
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
      description: 'Planeringen är publicerad',
      transitions: {
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avpublicera planeringen externt'
        }
      }
    },
    unpublished: {
      title: 'Avpublicerad',
      description: 'Planeringen har avpublicerats',
      transitions: {}
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
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avbryt och arkivera artikeln'
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
        },
        unpublished: {
          verify: true,
          title: 'Avpublicera',
          description: 'Avbryt och arkivera artikeln'
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
        unpublished: {
          verify: true,
          title: 'Avpublicera',
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
        }
      }
    },
    unpublished: {
      title: 'Avpublicerad',
      description: 'Artikeln har avpublicerats',
      transitions: {
        draft: {
          default: true,
          verify: true,
          title: 'Ny version',
          description: 'Fortsätt jobba på en ny version av artikeln'
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
      description: 'Faktarutan är användbar',
      transitions: {
        unpublished: {
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
        draft: {
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    },
    print_done: {
      title: 'Klar',
      description: 'Printartikeln är klar och väntar på godkännande',
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
        draft: {
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    },
    usable: {
      title: 'Exporterad',
      description: 'Printartikeln är exporterad',
      transitions: {
        cancelled: {
          verify: true,
          title: 'Dra tillbaka',
          description: 'Avbryt export och arkivera printartikeln'
        }
      }
    },
    cancelled: {
      title: 'Inställd',
      description: 'Printartikeln är avpublicerad',
      transitions: {
        draft: {
          title: 'Till utkast',
          description: 'Gör om printartikeln till ett utkast igen'
        }
      }
    }
  }
}
