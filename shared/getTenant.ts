let tenant = ''

export function setTenant(value: string): void {
  tenant = value
}

export function getTenant(): string {
  if (!tenant) {
    throw new Error('tenant has not been initialized. Call setTenant() first.')
  }

  return tenant
}
