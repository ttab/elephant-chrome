import i18n from 'i18next'
import {
  ArchiveIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleArrowLeftIcon,
  BadgeCheckIcon,
  CircleXIcon,
  type LucideIcon
} from '@ttab/elephant-ui/icons'

interface WorkflowItem {
  title: string
  promptTitle?: string
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
  },
  used: {
    icon: ArchiveIcon,
    className: 'text-muted-foreground'
  }
}


export function getWorkflowSpecifications(): Record<string, WorkflowSpecification> {
  const articleLabel = i18n.t('workflows:base.article')
  const flashLabel = i18n.t('workflows:base.flash')
  return {
    'core/article': {
      draft: {
        title: i18n.t('workflows:base.draft.title', { label: articleLabel }),
        description: i18n.t('workflows:base.draft.description', { label: articleLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          done: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.draft.transitions.done.title'),
            description: i18n.t('workflows:base.draft.transitions.done.description', { label: articleLabel })
          },
          approved: {
            verify: true,
            title: i18n.t('workflows:base.draft.transitions.approved.title'),
            description: i18n.t('workflows:base.draft.transitions.approved.description', { label: articleLabel })
          },
          usable: {
            verify: true,
            title: i18n.t('workflows:base.draft.transitions.usable.title'),
            description: i18n.t('workflows:base.draft.transitions.usable.description', { label: articleLabel })
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
        description: i18n.t('workflows:base.done.description', { label: articleLabel }),
        isWorkflow: true,
        transitions: {
          approved: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.done.transitions.approved.title'),
            description: i18n.t('workflows:base.done.transitions.approved.description', { label: articleLabel })
          },
          usable: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.usable.title'),
            description: i18n.t('workflows:base.done.transitions.usable.description', { label: articleLabel })
          },
          withheld: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.withheld.title'),
            description: i18n.t('workflows:base.done.transitions.withheld.description')
          },
          draft: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.draft.title'),
            description: i18n.t('workflows:base.done.transitions.draft.description', { label: articleLabel })
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.unpublished.title'),
            description: i18n.t('workflows:base.done.transitions.unpublished.description', { label: articleLabel })
          }
        }
      },
      approved: {
        title: i18n.t('workflows:base.approved.title'),
        description: i18n.t('workflows:base.approved.description', { label: articleLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          usable: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.usable.title'),
            description: i18n.t('workflows:base.approved.transitions.usable.description', { label: articleLabel })
          },
          withheld: {
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.withheld.title'),
            description: i18n.t('workflows:base.approved.transitions.withheld.description')
          },
          draft: {
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.draft.title'),
            description: i18n.t('workflows:base.approved.transitions.draft.description', { label: articleLabel })
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.unpublished.title'),
            description: i18n.t('workflows:base.approved.transitions.unpublished.description', { label: articleLabel })
          }
        }
      },
      usable: {
        title: i18n.t('workflows:base.usable.title'),
        description: i18n.t('workflows:base.usable.description', { label: articleLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          draft: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.usable.transitions.draft.title'),
            description: i18n.t('workflows:base.usable.transitions.draft.description', { label: articleLabel })
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:base.usable.transitions.unpublished.title'),
            description: i18n.t('workflows:base.usable.transitions.unpublished.description', { label: articleLabel })
          }
        }
      },
      withheld: {
        title: i18n.t('workflows:base.withheld.title'),
        description: i18n.t('workflows:base.withheld.description', { label: articleLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          usable: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.withheld.transitions.usable.title'),
            description: i18n.t('workflows:base.withheld.transitions.usable.description', { label: articleLabel })
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
        description: i18n.t('workflows:base.unpublished.description', { label: articleLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          draft: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.unpublished.transitions.draft.title'),
            description: i18n.t('workflows:base.unpublished.transitions.draft.description', { label: articleLabel })
          }
        }
      }
    },
    'core/flash': {
      draft: {
        title: i18n.t('workflows:base.draft.title', { label: flashLabel }),
        description: i18n.t('workflows:base.draft.description', { label: flashLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          done: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.draft.transitions.done.title'),
            description: i18n.t('workflows:base.draft.transitions.done.description', { label: flashLabel })
          },
          approved: {
            verify: true,
            title: i18n.t('workflows:base.draft.transitions.approved.title'),
            description: i18n.t('workflows:base.draft.transitions.approved.description', { label: flashLabel })
          },
          usable: {
            verify: true,
            title: i18n.t('workflows:base.draft.transitions.usable.title'),
            description: i18n.t('workflows:base.draft.transitions.usable.description', { label: flashLabel })
          }
        }
      },
      done: {
        title: i18n.t('workflows:base.done.title'),
        requireCause: true,
        description: i18n.t('workflows:base.done.description', { label: flashLabel }),
        isWorkflow: true,
        transitions: {
          approved: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.done.transitions.approved.title'),
            description: i18n.t('workflows:base.done.transitions.approved.description', { label: flashLabel })
          },
          usable: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.usable.title'),
            description: i18n.t('workflows:base.done.transitions.usable.description', { label: flashLabel })
          },
          draft: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.draft.title'),
            description: i18n.t('workflows:base.done.transitions.draft.description', { label: flashLabel })
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:base.done.transitions.unpublished.title'),
            description: i18n.t('workflows:base.done.transitions.unpublished.description', { label: flashLabel })
          }
        }
      },
      approved: {
        title: i18n.t('workflows:base.approved.title'),
        description: i18n.t('workflows:base.approved.description', { label: flashLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          usable: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.usable.title'),
            description: i18n.t('workflows:base.approved.transitions.usable.description', { label: flashLabel })
          },
          draft: {
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.draft.title'),
            description: i18n.t('workflows:base.approved.transitions.draft.description', { label: flashLabel })
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:base.approved.transitions.unpublished.title'),
            description: i18n.t('workflows:base.approved.transitions.unpublished.description', { label: flashLabel })
          }
        }
      },
      usable: {
        title: i18n.t('workflows:base.usable.title'),
        description: i18n.t('workflows:base.usable.description', { label: flashLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          draft: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.usable.transitions.draft.title'),
            description: i18n.t('workflows:base.usable.transitions.draft.description', { label: flashLabel })
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:base.usable.transitions.unpublished.title'),
            description: i18n.t('workflows:base.usable.transitions.unpublished.description', { label: flashLabel })
          }
        }
      },
      unpublished: {
        title: i18n.t('workflows:base.unpublished.title'),
        description: i18n.t('workflows:base.unpublished.description', { label: flashLabel }),
        isWorkflow: true,
        requireCause: true,
        transitions: {
          draft: {
            default: true,
            verify: true,
            title: i18n.t('workflows:base.unpublished.transitions.draft.title'),
            description: i18n.t('workflows:base.unpublished.transitions.draft.description', { label: flashLabel })
          }
        }
      }
    },
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
            promptTitle: i18n.t('workflows:core/event.draft.transitions.usable.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/event.done.transitions.usable.promptTitle'),
            description: i18n.t('workflows:core/event.done.transitions.usable.description')
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:core/event.done.transitions.unpublished.title'),
            promptTitle: i18n.t('workflows:core/event.done.transitions.unpublished.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/event.usable.transitions.unpublished.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/event.unpublished.transitions.draft.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/planning-item.draft.transitions.usable.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/planning-item.done.transitions.usable.promptTitle'),
            verify: true,
            description: i18n.t('workflows:core/planning-item.done.transitions.usable.description')
          },
          unpublished: {
            verify: true,
            title: i18n.t('workflows:core/planning-item.done.transitions.unpublished.title'),
            promptTitle: i18n.t('workflows:core/planning-item.done.transitions.unpublished.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/planning-item.usable.transitions.unpublished.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/planning-item.unpublished.transitions.draft.promptTitle'),
            description: i18n.t('workflows:core/planning-item.unpublished.transitions.draft.description')
          }
        }
      }
    },
    'core/article#timeless': {
      draft: {
        title: i18n.t('workflows:base.draft.title', { label: i18n.t('workflows:base.article') }),
        description: i18n.t('workflows:base.draft.description', { label: i18n.t('workflows:base.article') }),
        isWorkflow: true,
        transitions: {
          done: {
            default: true,
            title: i18n.t('workflows:base.draft.transitions.done.title'),
            description: i18n.t('workflows:base.draft.transitions.done.description', { label: i18n.t('workflows:base.article') })
          }
        }
      },
      done: {
        title: i18n.t('workflows:base.done.title'),
        description: i18n.t('workflows:base.done.description', { label: i18n.t('workflows:base.article') }),
        isWorkflow: true,
        transitions: {
          draft: {
            default: true,
            title: i18n.t('workflows:base.done.transitions.draft.title'),
            description: i18n.t('workflows:base.done.transitions.draft.description', { label: i18n.t('workflows:base.article') })
          }
        }
      },
      used: {
        title: i18n.t('workflows:base.used.title'),
        description: i18n.t('workflows:base.used.description', { label: i18n.t('workflows:base.article') }),
        isWorkflow: false,
        transitions: {
          draft: {
            default: true,
            title: i18n.t('workflows:base.used.transitions.draft.title'),
            description: i18n.t('workflows:base.used.transitions.draft.description', { label: i18n.t('workflows:base.article') })
          }
        }
      }
    },
    'core/factbox': {
      draft: {
        title: i18n.t('workflows:core/factbox.draft.title'),
        description: i18n.t('workflows:core/factbox.draft.description'),
        isWorkflow: false,
        transitions: {
          usable: {
            verify: true,
            title: i18n.t('workflows:core/factbox.draft.transitions.usable.title'),
            description: i18n.t('workflows:core/factbox.draft.transitions.usable.description'),
            promptTitle: i18n.t('workflows:core/factbox.draft.transitions.usable.promptTitle')
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
            description: i18n.t('workflows:core/factbox.usable.transitions.draft.description'),
            promptTitle: i18n.t('workflows:core/factbox.usable.transitions.draft.promptTitle')
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
            promptTitle: i18n.t('workflows:core/editorial-info.draft.transitions.done.promptTitle'),
            description: i18n.t('workflows:core/editorial-info.draft.transitions.done.description')
          },
          approved: {
            title: i18n.t('workflows:core/editorial-info.draft.transitions.approved.title'),
            promptTitle: i18n.t('workflows:core/editorial-info.draft.transitions.approved.promptTitle'),
            description: i18n.t('workflows:core/editorial-info.draft.transitions.approved.description')
          },
          usable: {
            verify: true,
            title: i18n.t('workflows:core/editorial-info.draft.transitions.usable.title'),
            promptTitle: i18n.t('workflows:core/editorial-info.draft.transitions.usable.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/editorial-info.done.transitions.approved.promptTitle'),
            description: i18n.t('workflows:core/editorial-info.done.transitions.approved.description')
          },
          usable: {
            verify: true,
            title: i18n.t('workflows:core/editorial-info.done.transitions.usable.title'),
            promptTitle: i18n.t('workflows:core/editorial-info.done.transitions.usable.promptTitle'),
            description: i18n.t('workflows:core/editorial-info.done.transitions.usable.description')
          },
          draft: {
            title: i18n.t('workflows:core/editorial-info.done.transitions.draft.title'),
            promptTitle: i18n.t('workflows:core/editorial-info.done.transitions.draft.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/editorial-info.approved.transitions.usable.promptTitle'),
            description: i18n.t('workflows:core/editorial-info.approved.transitions.usable.description')
          },
          draft: {
            title: i18n.t('workflows:core/editorial-info.approved.transitions.draft.title'),
            promptTitle: i18n.t('workflows:core/editorial-info.approved.transitions.draft.promptTitle'),
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
            promptTitle: i18n.t('workflows:core/editorial-info.usable.transitions.draft.promptTitle'),
            description: i18n.t('workflows:core/editorial-info.usable.transitions.draft.description')
          },
          unpublished: {
            title: i18n.t('workflows:core/editorial-info.usable.transitions.unpublished.title'),
            promptTitle: i18n.t('workflows:core/editorial-info.usable.transitions.unpublished.promptTitle'),
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
            promptTitle: 'Begär korrläsning av printartikeln',
            description: 'Behöver korrläsning av printartikeln'
          },
          print_done: {
            title: 'Klarmarkera',
            promptTitle: 'Klarmarkera printartikeln',
            description: 'Markera printartikeln som klar'
          },
          usable: {
            verify: true,
            title: 'Exportera',
            promptTitle: 'Exportera printartikeln',
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
            promptTitle: 'Klarmarkera printartikeln',
            description: 'Markera printartikeln som klar'
          },
          usable: {
            verify: true,
            title: 'Exportera',
            promptTitle: 'Exportera printartikeln',
            description: 'Exportera printartikeln'
          },
          cancelled: {
            verify: true,
            title: 'Kasta',
            promptTitle: 'Kasta printartikeln',
            description: 'Kasta printartikeln'
          },
          draft: {
            verify: true,
            title: 'Till utkast',
            promptTitle: 'Gör om printartikeln till ett utkast',
            description: 'Gör om printartikeln till ett utkast igen'
          }
        }
      },
      print_done: {
        title: 'Klar',
        description: 'Printartikeln är klar och väntar på godkännande',
        isWorkflow: true,
        transitions: {
          usable: {
            verify: true,
            title: 'Exportera',
            promptTitle: 'Exportera printartikeln',
            description: 'Exportera printartikeln'
          },
          needs_proofreading: {
            title: 'Begär korrläsning',
            promptTitle: 'Begär korrläsning av printartikeln',
            description: 'Behöver korrläsning av printartikeln'
          },
          cancelled: {
            title: 'Kasta',
            promptTitle: 'Kasta printartikeln',
            description: 'Kasta printartikeln'
          },
          draft: {
            title: 'Till utkast',
            promptTitle: 'Gör om printartikeln till ett utkast',
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
            promptTitle: 'Dra tillbaka printartikeln',
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
            promptTitle: 'Gör om printartikeln till ett utkast',
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
            promptTitle: 'Gör om printartikeln till ett utkast',
            description: 'Gör om printartikeln till ett utkast igen'
          }
        }
      }
    }
  }
}
