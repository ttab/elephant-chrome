let environment = ''

export function setEnvironment(env: string): void {
  environment = env
}

export function getEnvironment(): string {
  return environment
}
