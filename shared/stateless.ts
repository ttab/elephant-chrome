/**
 * This module defines the StatelessType enum and related schemas for different types of stateless messages.
 * It also provides functions to parse and create stateless messages.
 *
 * @module shared/stateless
 */

import { z } from 'zod'
import type pino from 'pino'

export enum StatelessType {
  AUTH = 'auth',
  MESSAGE = 'message',
  ERROR = 'error'
}

const ErrorMessageSchema = z.object({
  type: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  code: z.string().optional(),
  signal: z.string().optional()
})

const StatelessErrorSchema = z.object({
  type: z.enum([StatelessType.ERROR]),
  message: ErrorMessageSchema
})

const StatelessMessageSchema = z.object({
  type: z.enum([StatelessType.MESSAGE]),
  message: z.string()
})

const authMessageSchema = z.object({
  accessToken: z.string()
})

const StatelessAuthSchema = z.object({
  type: z.enum([StatelessType.AUTH]),
  message: authMessageSchema
})

export type StatelessAuth = z.infer<typeof StatelessAuthSchema>
type StatelessMessage = z.infer<typeof StatelessMessageSchema>

type authMessage = z.infer<typeof authMessageSchema>

type StatelessPayload = StatelessAuth | StatelessMessage

const StatelessSchemaMap = {
  [StatelessType.AUTH]: StatelessAuthSchema,
  [StatelessType.MESSAGE]: StatelessMessageSchema,
  [StatelessType.ERROR]: StatelessErrorSchema
}

export function parseStateless<T extends StatelessPayload>(payload: string): T {
  if (!payload.includes('@')) {
    throw new Error('Invalid stateless message: Missing separator')
  }
  const separator = payload.indexOf('@')
  const type = payload.slice(0, separator) as StatelessType
  const message = payload.slice(separator + 1)

  if (!Object.values(StatelessType).includes(type)) {
    throw new Error(`Invalid stateless type: ${type}`)
  }

  const schema = StatelessSchemaMap[type] as z.ZodSchema<T>
  const parsedMessage = JSON.parse(message) as T
  return schema.parse({ type, message: parsedMessage })
}


/**
 * Creates a stateless message based on a prefix and a message.
 *
 * @param {StatelessType} prefix - The prefix for the stateless message. Must be a valid StatelessType.
 * @param {string | StatelessInProgressMessage | pino.SerializedError} message - The message to be included in the stateless message. Can be a string, a StatelessInProgressMessage, or a pino.SerializedError.
 * @returns {string} The stateless message as a string.
 * @throws {Error} Will throw an error if the prefix is not a valid StatelessType.
 */

type StatelessMessageType = string | authMessage | pino.SerializedError
export function createStateless(prefix: StatelessType, message: StatelessMessageType): string {
  if (!Object.values(StatelessType).includes(prefix)) {
    throw new Error(`Invalid stateless type: ${prefix as string}`)
  }
  return `${prefix as string}@${JSON.stringify(message)}`
}
