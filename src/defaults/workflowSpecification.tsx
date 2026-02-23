import i18n from '@/lib/i18n'
import {
  CircleCheckIcon,
  CircleDotIcon,
  CircleArrowLeftIcon,
  BadgeCheckIcon,
  CircleXIcon,
  type LucideIcon
} from '@ttab/elephant-ui/icons'
import type { TFunction } from 'i18next'

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
  const typeLabel = type === 'flash' ? i18n.t('workflows:base.flash') : i18n.t('workflows:base.article')

  return {
    draft: {
      title: i18n.t('workflows:base.draft.title', { label: typeLabel }),
      description: i18n.t('workflows:base.draft.description', { label: typeLabel }),
      isWorkflow: true,
      requireCause: true,
      transitions: {
        done: {
          default: true,
          verify: true,
          title: i18n.t('workflows:base.draft.transitions.done.title'),
          description: i18n.t('workflows:base.draft.transitions.done.description', { label: typeLabel })
        },
        approved: {
          verify: true,
          title: i18n.t('workflows:base.draft.transitions.approved.title'),
          description: i18n.t('workflows:base.draft.transitions.approved.description', { label: typeLabel })
        },
        usable: {
          verify: true,
          title: i18n.t('workflows:base.draft.transitions.usable.title'),
          description: i18n.t('workflows:base.draft.transitions.usable.description', { label: typeLabel })
        },
        withheld: {
          verify: true,
          title: i18n.t('workflows:base.draft.transitions.withheld.title'),
          description: i18n.t('workflows:base.draft.transitions.withheld.description')
        }
      }
    },
    done: {
      title: i18n.t('workflows:base.done.title'),
      requireCause: true,
      description: i18n.t('workflows:base.done.description', { label: typeLabel }),
      isWorkflow: true,
      transitions: {
        approved: {
          default: true,
          verify: true,
          title: i18n.t('workflows:base.done.transitions.approved.title'),
          description: i18n.t('workflows:base.done.transitions.approved.description', { label: typeLabel })
        },
        usable: {
          verify: true,
          title: i18n.t('workflows:base.done.transitions.usable.title'),
          description: i18n.t('workflows:base.done.transitions.usable.description', { label: typeLabel })
        },
        withheld: {
          verify: true,
          title: i18n.t('workflows:base.done.transitions.withheld.title'),
          description: i18n.t('workflows:base.done.transitions.withheld.description')
        },
        draft: {
          verify: true,
          title: i18n.t('workflows:base.done.transitions.draft.title'),
          description: i18n.t('workflows:base.done.transitions.draft.description', { label: typeLabel })
        },
        unpublished: {
          verify: true,
          title: i18n.t('workflows:base.done.transitions.unpublished.title'),
          description: i18n.t('workflows:base.done.transitions.unpublished.description', { label: typeLabel })
        }
      }
    },
    approved: {
      title: i18n.t('workflows:base.approved.title'),
      description: i18n.t('workflows:base.approved.description', { label: typeLabel }),
      isWorkflow: true,
      requireCause: true,
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: i18n.t('workflows:base.approved.transitions.usable.title'),
          description: i18n.t('workflows:base.approved.transitions.usable.description', { label: typeLabel })
        },
        withheld: {
          verify: true,
          title: i18n.t('workflows:base.approved.transitions.withheld.title'),
          description: i18n.t('workflows:base.approved.transitions.withheld.description')
        },
        draft: {
          verify: true,
          title: i18n.t('workflows:base.approved.transitions.draft.title'),
          description: i18n.t('workflows:base.approved.transitions.draft.description', { label: typeLabel })
        },
        unpublished: {
          verify: true,
          title: i18n.t('workflows:base.approved.transitions.unpublished.title'),
          description: i18n.t('workflows:base.approved.transitions.unpublished.description', { label: typeLabel })
        }
      }
    },
    usable: {
      title: i18n.t('workflows:base.usable.title'),
      description: i18n.t('workflows:base.usable.description', { label: typeLabel }),
      isWorkflow: true,
      requireCause: true,
      transitions: {
        draft: {
          default: true,
          verify: true,
          title: i18n.t('workflows:base.usable.transitions.draft.title'),
          description: i18n.t('workflows:base.usable.transitions.draft.description', { label: typeLabel })
        },
        unpublished: {
          verify: true,
          title: i18n.t('workflows:base.usable.transitions.unpublished.title'),
          description: i18n.t('workflows:base.usable.transitions.unpublished.description', { label: typeLabel })
        }
      }
    },
    withheld: {
      title: i18n.t('workflows:base.withheld.title'),
      description: i18n.t('workflows:base.withheld.description', { label: typeLabel }),
      isWorkflow: true,
      requireCause: true,
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: i18n.t('workflows:base.withheld.transitions.usable.title'),
          description: i18n.t('workflows:base.withheld.transitions.usable.description', { label: typeLabel })
        },
        draft: {
          verify: true,
          title: i18n.t('workflows:base.withheld.transitions.draft.title'),
          description: i18n.t('workflows:base.withheld.transitions.draft.description')
        }
      }
    },
    unpublished: {
      title: i18n.t('workflows:base.unpublished.title'),
      description: i18n.t('workflows:base.unpublished.description', { label: typeLabel }),
      isWorkflow: true,
      requireCause: true,
      transitions: {
        draft: {
          default: true,
          verify: true,
          title: i18n.t('workflows:base.unpublished.transitions.draft.title'),
          description: i18n.t('workflows:base.unpublished.transitions.draft.description', { label: typeLabel })
        }
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
      title: i18n.t('workflows:core/event.draft.title'),
      description: i18n.t('workflows:core/event.draft.description'),
      isWorkflow: false,
      asSave: false,
      transitions: {
        done: {
          default: true,
          verify: false,
          title: i18n.t('workflows:core/event.draft.transitions.done.title'),
          description: i18n.t('workflows:core/event.draft.transitions.done.description')
        },
        usable: {
          verify: true,
          title: i18n.t('workflows:core/event.draft.transitions.usable.title'),
          description: i18n.t('workflows:core/event.draft.transitions.usable.description')
        }
      }
    },
    done: {
      title: i18n.t('workflows:core/event.done.title'),
      description: i18n.t('workflows:core/event.done.description'),
      isWorkflow: false,
      transitions: {
        usable: {
          verify: true,
          title: i18n.t('workflows:core/event.done.transitions.usable.title'),
          description: i18n.t('workflows:core/event.done.transitions.usable.description')
        },
        unpublished: {
          verify: true,
          title: i18n.t('workflows:core/event.done.transitions.unpublished.title'),
          description: i18n.t('workflows:core/event.done.transitions.unpublished.description')
        }
      }
    },
    usable: {
      title: i18n.t('workflows:core/event.usable.title'),
      asSaveCTA: i18n.t('workflows:core/event.usable.asSaveCTA'),
      asSaveTitle: i18n.t('workflows:core/event.usable.asSaveTitle'),
      description: i18n.t('workflows:core/event.usable.description'),
      changedDescription: i18n.t('workflows:core/event.usable.changedDescription'),
      updateDescription: i18n.t('workflows:core/event.usable.updateDescription'),
      isWorkflow: false,
      asSave: true,
      transitions: {
        unpublished: {
          verify: true,
          title: i18n.t('workflows:core/event.usable.transitions.unpublished.title'),
          description: i18n.t('workflows:core/event.usable.transitions.unpublished.description')
        }
      }
    },
    unpublished: {
      title: i18n.t('workflows:core/event.unpublished.title'),
      description: i18n.t('workflows:core/event.unpublished.description'),
      isWorkflow: false,
      transitions: {
        draft: {
          verify: true,
          title: i18n.t('workflows:core/event.unpublished.transitions.draft.title'),
          description: i18n.t('workflows:core/event.unpublished.transitions.draft.description')
        }
      }
    }
  },
  'core/planning-item': {
    draft: {
      title: i18n.t('workflows:core/planning-item.draft.title'),
      description: i18n.t('workflows:core/planning-item.draft.description'),
      isWorkflow: false,
      asSave: false,
      transitions: {
        done: {
          default: true,
          verify: false,
          title: i18n.t('workflows:core/planning-item.draft.transitions.done.title'),
          description: i18n.t('workflows:core/planning-item.draft.transitions.done.description')
        },
        usable: {
          verify: true,
          title: i18n.t('workflows:core/planning-item.draft.transitions.usable.title'),
          description: i18n.t('workflows:core/planning-item.draft.transitions.usable.description')
        }
      }
    },
    done: {
      title: i18n.t('workflows:core/planning-item.done.title'),
      description: i18n.t('workflows:core/planning-item.done.description'),
      isWorkflow: false,
      transitions: {
        usable: {
          title: i18n.t('workflows:core/planning-item.done.transitions.usable.title'),
          verify: true,
          description: i18n.t('workflows:core/planning-item.done.transitions.usable.description')
        },
        unpublished: {
          verify: true,
          title: i18n.t('workflows:core/planning-item.done.transitions.unpublished.title'),
          description: i18n.t('workflows:core/planning-item.done.transitions.unpublished.description')
        }
      }
    },
    usable: {
      title: i18n.t('workflows:core/planning-item.usable.title'),
      asSaveCTA: i18n.t('workflows:core/planning-item.usable.asSaveCTA'),
      asSaveTitle: i18n.t('workflows:core/planning-item.usable.asSaveTitle'),
      description: i18n.t('workflows:core/planning-item.usable.description'),
      changedDescription: i18n.t('workflows:core/planning-item.usable.changedDescription'),
      updateDescription: i18n.t('workflows:core/planning-item.usable.updateDescription'),
      isWorkflow: false,
      asSave: true,
      transitions: {
        unpublished: {
          verify: true,
          title: i18n.t('workflows:core/planning-item.usable.transitions.unpublished.title'),
          description: i18n.t('workflows:core/planning-item.usable.transitions.unpublished.description')
        }
      }
    },
    unpublished: {
      title: i18n.t('workflows:core/planning-item.unpublished.title'),
      description: i18n.t('workflows:core/planning-item.unpublished.description'),
      isWorkflow: false,
      transitions: {
        draft: {
          verify: true,
          title: i18n.t('workflows:core/planning-item.unpublished.transitions.draft.title'),
          description: i18n.t('workflows:core/planning-item.unpublished.transitions.draft.description')
        }
      }
    }
  },
  'core/article': baseDeliverable('article'),
  'core/flash': baseDeliverable('flash'),
  'core/factbox': {
    draft: {
      title: i18n.t('workflows:core/factbox.draft.title'),
      description: i18n.t('workflows:core/factbox.draft.description'),
      isWorkflow: false,
      transitions: {
        usable: {
          verify: true,
          title: i18n.t('workflows:core/factbox.draft.transitions.usable.title'),
          description: i18n.t('workflows:core/factbox.draft.transitions.usable.description')
        }
      }
    },
    usable: {
      title: i18n.t('workflows:core/factbox.usable.title'),
      asSaveCTA: i18n.t('workflows:core/factbox.usable.asSaveCTA'),
      asSaveTitle: i18n.t('workflows:core/factbox.usable.asSaveTitle'),
      description: i18n.t('workflows:core/factbox.usable.description'),
      isWorkflow: false,
      asSave: true,
      transitions: {
        draft: {
          verify: true,
          title: i18n.t('workflows:core/factbox.usable.transitions.draft.title'),
          description: i18n.t('workflows:core/factbox.usable.transitions.draft.description')
        }
      }
    }
  },
  'core/editorial-info': {
    draft: {
      title: i18n.t('workflows:core/editorial-info.draft.title'),
      description: i18n.t('workflows:core/editorial-info.draft.description'),
      isWorkflow: true,
      transitions: {
        done: {
          default: true,
          title: i18n.t('workflows:core/editorial-info.draft.transitions.done.title'),
          description: i18n.t('workflows:core/editorial-info.draft.transitions.done.description')
        },
        approved: {
          title: i18n.t('workflows:core/editorial-info.draft.transitions.approved.title'),
          description: i18n.t('workflows:core/editorial-info.draft.transitions.approved.description')
        },
        usable: {
          verify: true,
          title: i18n.t('workflows:core/editorial-info.draft.transitions.usable.title'),
          description: i18n.t('workflows:core/editorial-info.draft.transitions.usable.description')
        }
      }
    },
    done: {
      title: i18n.t('workflows:core/editorial-info.done.title'),
      description: i18n.t('workflows:core/editorial-info.done.description'),
      isWorkflow: true,
      transitions: {
        approved: {
          default: true,
          title: i18n.t('workflows:core/editorial-info.done.transitions.approved.title'),
          description: i18n.t('workflows:core/editorial-info.done.transitions.approved.description')
        },
        usable: {
          verify: true,
          title: i18n.t('workflows:core/editorial-info.done.transitions.usable.title'),
          description: i18n.t('workflows:core/editorial-info.done.transitions.usable.description')
        },
        draft: {
          title: i18n.t('workflows:core/editorial-info.done.transitions.draft.title'),
          description: i18n.t('workflows:core/editorial-info.done.transitions.draft.description')
        }
      }
    },
    approved: {
      title: i18n.t('workflows:core/editorial-info.approved.title'),
      description: i18n.t('workflows:core/editorial-info.approved.description'),
      isWorkflow: true,
      transitions: {
        usable: {
          default: true,
          verify: true,
          title: i18n.t('workflows:core/editorial-info.approved.transitions.usable.title'),
          description: i18n.t('workflows:core/editorial-info.approved.transitions.usable.description')
        },
        draft: {
          title: i18n.t('workflows:core/editorial-info.approved.transitions.draft.title'),
          description: i18n.t('workflows:core/editorial-info.approved.transitions.draft.description')
        }
      }
    },
    usable: {
      title: i18n.t('workflows:core/editorial-info.usable.title'),
      description: i18n.t('workflows:core/editorial-info.usable.description'),
      isWorkflow: true,
      transitions: {
        draft: {
          default: true,
          title: i18n.t('workflows:core/editorial-info.usable.transitions.draft.title'),
          description: i18n.t('workflows:core/editorial-info.usable.transitions.draft.description')
        },
        unpublished: {
          title: i18n.t('workflows:core/editorial-info.usable.transitions.unpublished.title'),
          description: i18n.t('workflows:core/editorial-info.usable.transitions.unpublished.description')
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

export const getWorkflowSpecifications = (path: string, t: TFunction) => {
  return t(WorkflowSpecifications[path] as unknown as string)
}
