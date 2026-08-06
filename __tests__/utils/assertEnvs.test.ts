import assertEnvs from '../../src-srv/lib/assertEnvs'

const requiredEnvs = [
  'AUTH_KEYCLOAK_ISSUER',
  'AUTH_KEYCLOAK_SECRET',
  'AUTH_KEYCLOAK_ID',
  'AUTH_TRUST_HOST',
  'AUTH_SECRET',
  'ELEPHANT_CHROME_CLIENT_ID',
  'ELEPHANT_CHROME_CLIENT_SECRET',
  'REPOSITORY_URL',
  'USER_URL',
  'REDIS_URL',
  'INDEX_URL',
  'WS_URL',
  'IMAGE_SEARCH_URL',
  'IMAGE_SEARCH_PROVIDER',
  'PROTOCOL',
  'HOST',
  'PORT',
  'BASE_URL',
  'SYSTEM_LANGUAGE',
  'TENANT'
]

describe('assertEnvs', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }

    requiredEnvs.forEach((env) => {
      process.env[env] = 'value'
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('does not throw when all required variables are set', () => {
    expect(() => assertEnvs()).not.toThrow()
  })

  it('throws when TENANT is missing', () => {
    delete process.env.TENANT

    expect(() => assertEnvs()).toThrow('Environment variable TENANT is required')
  })

  it('throws when TENANT is empty', () => {
    process.env.TENANT = ''

    expect(() => assertEnvs()).toThrow('Environment variable TENANT is required')
  })
})
