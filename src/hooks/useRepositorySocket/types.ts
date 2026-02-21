import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'

export type DecoratorDataBase = Record<string, Record<string, object>>

export interface Decorator<TEnrichment = unknown> {
  namespace: string
  onInitialData?: (
    documents: DocumentStateWithIncludes[],
    accessToken: string
  ) => Promise<Map<string, TEnrichment>>
  onUpdate?: (
    update: DocumentUpdate,
    accessToken: string
  ) => Promise<TEnrichment | Map<string, TEnrichment> | undefined>
}

export type DecoratorConfig<TEnrichment = unknown> = Decorator<TEnrichment>[]

export interface DocumentStateWithDecorators<TDecoratorData = object>
  extends DocumentStateWithIncludes {
  decoratorData?: TDecoratorData
}
