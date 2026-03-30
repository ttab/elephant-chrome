let environment = ''

export function setEnvironment(env?: string): void {
  if (!env) {
    return
  }

  environment = env
}

export function getEnvironment(): string {
  return environment
}
