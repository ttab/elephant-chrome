import { pino } from 'pino'

const errorWithCauseSerializer = (err: unknown): unknown => {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
      cause: err.cause ? errorWithCauseSerializer(err.cause) : undefined
    }
  }
  return err
}


const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    err: errorWithCauseSerializer
  },
  formatters: {
    level(label: string) {
      return { level: label }
    }
  }
})

export default logger
