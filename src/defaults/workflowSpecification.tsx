import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleArrowLeftIcon,
  BadgeCheckIcon,
  CircleXIcon,
  type LucideIcon
} from '@ttab/elephant-ui/icons'

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

const baseDeliverable: WorkflowSpecification = {
  draft: {
    title: 'Utkast',
    description: 'Du jobbar på ett utkast av artikeln',
    isWorkflow: true,
    requireCause: true,
    transitions: {
      done: {
        default: true,
        verify: true,
        title: 'Klarmarkera',
        description: 'Markera artikeln som klar'
      },
      approved: {
        verify: true,
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
    requireCause: true,
    description: 'Artikeln är klar och väntar på godkännande',
    isWorkflow: true,
    transitions: {
      approved: {
        default: true,
        verify: true,
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
        verify: true,
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
    isWorkflow: true,
    requireCause: true,
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
        verify: true,
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
    isWorkflow: true,
    requireCause: true,
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
    isWorkflow: true,
    requireCause: true,
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
    isWorkflow: true,
    requireCause: true,
    transitions: {
      draft: {
        default: true,
        verify: true,
        title: 'Ny version',
        description: 'Fortsätt jobba på en ny version av artikeln'
      }
    }
  }
}

export const StatusSpecifications: Record<string, StatusSpecification> = {
  draft: {
    icon: CircleDotIcon,
    className: ''
  },
  done: {
    icon: CircleCheckIcon,
    className: 'bg-done text-white fill-done rounded-full dark:text-black'
  },
  approved: {
    icon: BadgeCheckIcon,
    className: 'bg-approved text-white fill-approved rounded-full dark:text-black'
  },
  withheld: {
    icon: CircleCheckIcon,
    className: 'bg-withheld text-white fill-withheld rounded-full dark:text-black'
  },
  usable: {
    icon: CircleCheckIcon,
    className: 'bg-usable text-white fill-usable rounded-full dark:text-black'
  },
  unpublished: {
    icon: CircleArrowLeftIcon,
    className: 'bg-unpublished text-white fill-unpublished rounded-full dark:text-black'
  },
  print_done: {
    icon: BadgeCheckIcon,
    className: 'bg-approved text-white fill-approved rounded-full dark:text-black'
  },
  needs_proofreading: {
    icon: CircleCheckIcon,
    className: 'bg-done text-white fill-done rounded-full dark:text-black'
  },
  cancelled: {
    icon: CircleXIcon,
    className: 'bg-cancelled text-white fill-cancelled rounded-full dark:text-black'
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
          description: 'Avpublicera händelsen externt'
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
  'core/article': baseDeliverable,
  'core/flash': baseDeliverable,
  // Factbox workflow needs to be defined
  'core/factbox': {
    draft: {
      title: 'Utkast',
      description: 'Du jobbar på ett utkast av faktarutan',
      isWorkflow: false,
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
      asSaveCTA: 'Ändrad',
      asSaveTitle: 'Publicera ny information',
      description: 'Faktarutan är användbar',
      isWorkflow: false,
      asSave: true,
      transitions: {
        draft: {
          verify: true,
          title: 'Till utkast',
          description: 'Gör om faktarutan till ett utkast igen'
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
