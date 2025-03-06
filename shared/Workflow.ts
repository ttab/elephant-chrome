import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { WorkflowsClient } from '@ttab/elephant-api/repository'
import type { DocumentWorkflow, WorkflowStatus } from '@ttab/elephant-api/repository'
import { meta } from './meta.js'

export interface WorkflowAndStatuses {
  workflow: DocumentWorkflow | null
  statuses: WorkflowStatus[]
}

export class Workflow {
  readonly #client: WorkflowsClient
  #workflows: Record<string, {
    workflow: DocumentWorkflow | null
    statuses: WorkflowStatus[]
  }>

  constructor(repoUrl: string) {
    this.#client = new WorkflowsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString()
      })
    )

    this.#workflows = {}
  }

  /**
   * Get a workflow specification, either both workflow and statuses or only statuses if no workflow is defined.
   */
  async getWorkflow({ type, accessToken }: {
    type: string
    accessToken: string
  }): Promise<WorkflowAndStatuses | null> {
    if (this.#workflows[type]) {
      return this.#workflows[type]
    }

    const [workflow, statuses] = await Promise.all([
      this.#fetchWorkflow({ type, accessToken }),
      this.#fetchStatuses({ type, accessToken })
    ])

    this.#workflows[type] = {
      workflow,
      statuses
    }

    return this.#workflows[type]
  }

  /**
   * Get a workflow specification from the repository.
   */
  async #fetchWorkflow({ type, accessToken }: {
    type: string
    accessToken: string
  }): Promise<DocumentWorkflow | null> {
    try {
      const { response } = await this.#client.getWorkflow({
        type
      }, meta(accessToken))

      return response.workflow || null
    } catch (err: unknown) {
      if (['not_found', 'internal'].includes((err as { code: string })?.code)) {
        return null
      }

      throw new Error(`Unable to fetch workflow for ${type}: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Get a workflow specification from the repository.
   */
  async #fetchStatuses({ type, accessToken }: {
    type: string
    accessToken: string
  }): Promise<WorkflowStatus[]> {
    try {
      const { response } = await this.#client.getStatuses({
        type
      }, meta(accessToken))

      // FIXME: Remove filter when endpoint handles type in options.
      return response.statuses?.filter((s) => s.type === type) || []
    } catch (err: unknown) {
      if (['not_found', 'internal'].includes((err as { code: string })?.code)) {
        return []
      }

      throw new Error(`Unable to fetch statuess for ${type}: ${(err as Error)?.message || 'Unknown error'}`)
    }
  }
}
