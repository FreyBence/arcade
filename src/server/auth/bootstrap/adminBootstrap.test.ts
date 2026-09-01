// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createAccessTokenService } from '../accessToken'
import { protectAdminEndpoint } from '../authorization'
import { loginUser } from '../loginService'
import { hashPassword, verifyPassword } from '../passwordService'
import { createRequestAuthenticator, type RequestIdentity } from '../requestAuthentication'
import type { CredentialUser } from '../loginTypes'
import type { SafeUser } from '../registrationTypes'
import { AdminBootstrapError, bootstrapAdmin, readAdminBootstrapConfig, type AdminBootstrapRepository, type NewAdminRecord } from './adminBootstrap'

const CREATED_AT = new Date('2026-08-31T00:00:00.000Z')
const VALID_ENVIRONMENT = {
  ADMIN_NAME: '  Arcade Administrator  ',
  ADMIN_EMAIL: '  Admin@Example.COM ',
  ADMIN_PASSWORD: 'strong-admin-password',
}

const configCases = [
  {
    name: 'reads and normalizes all required server configuration',
    input: VALID_ENVIRONMENT,
    expected: { config: { name: 'Arcade Administrator', email: 'admin@example.com', password: 'strong-admin-password' }, error: undefined },
  },
  {
    name: 'fails safely when required configuration is missing',
    input: { ADMIN_NAME: 'Administrator', ADMIN_EMAIL: undefined, ADMIN_PASSWORD: undefined },
    expected: { config: undefined, error: 'MISSING_CONFIG' },
  },
  {
    name: 'fails safely when configuration is invalid',
    input: { ADMIN_NAME: 'Administrator', ADMIN_EMAIL: 'invalid', ADMIN_PASSWORD: 'short' },
    expected: { config: undefined, error: 'INVALID_CONFIG' },
  },
]

describe('admin bootstrap configuration', () => {
  it.each(configCases)('$name', ({ input, expected }) => {
    try {
      expect({ config: readAdminBootstrapConfig(input), error: undefined }).toEqual(expected)
    } catch (error) {
      expect(error).toBeInstanceOf(AdminBootstrapError)
      expect({ config: undefined, error: (error as AdminBootstrapError).code }).toEqual(expected)
    }
  })
})

function safeUser(admin: NewAdminRecord, role: SafeUser['role'] = admin.role): SafeUser {
  return {
    id: 'admin-id',
    name: admin.name,
    email: admin.email,
    role,
    dinoCoins: 0,
    profileImage: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }
}

const bootstrapCases = [
  {
    name: 'creates an administrator with a hashed password',
    input: { existingRole: undefined },
    expected: { role: 'ADMIN', upserts: 1, error: undefined },
  },
  {
    name: 'does not duplicate an existing administrator',
    input: { existingRole: 'ADMIN' as const },
    expected: { role: 'ADMIN', upserts: 1, error: undefined },
  },
  {
    name: 'promotes an existing public account to administrator',
    input: { existingRole: 'VIEWER' as const },
    expected: { role: 'ADMIN', upserts: 1, error: undefined },
  },
]

describe('admin bootstrap service', () => {
  it.each(bootstrapCases)('$name', async ({ input, expected }) => {
    const hash = vi.fn(() => Promise.resolve('argon2-hash'))
    let storedRole = input.existingRole
    const upsertAdmin = vi.fn((admin: NewAdminRecord) => {
      storedRole = admin.role
      return Promise.resolve(safeUser(admin, storedRole))
    })
    const operation = bootstrapAdmin(readAdminBootstrapConfig(VALID_ENVIRONMENT), { hashPassword: hash, users: { upsertAdmin } })

    if (expected.error) await expect(operation).rejects.toMatchObject({ code: expected.error })
    else await expect(operation).resolves.toMatchObject({ role: expected.role })
    expect(hash).toHaveBeenCalledWith(VALID_ENVIRONMENT.ADMIN_PASSWORD)
    expect(upsertAdmin).toHaveBeenCalledWith({
      name: 'Arcade Administrator',
      email: 'admin@example.com',
      passwordHash: 'argon2-hash',
      role: 'ADMIN',
    })
    expect(upsertAdmin).toHaveBeenCalledTimes(expected.upserts)
  })
})

const integrationCases = [{
  name: 'creates an admin that can log in and access an admin endpoint',
  input: VALID_ENVIRONMENT,
  expected: { role: 'ADMIN', loginRole: 'ADMIN', endpointStatus: 200, createdUsers: 1 },
}]

describe('bootstrapped administrator integration', () => {
  it.each(integrationCases)('$name', async ({ input, expected }) => {
    let credentialUser: CredentialUser | null = null
    let createdUsers = 0
    const users: AdminBootstrapRepository = {
      upsertAdmin(admin) {
        if (!credentialUser) {
          createdUsers += 1
          credentialUser = { ...safeUser(admin), passwordHash: admin.passwordHash }
        }
        return Promise.resolve(credentialUser)
      },
    }
    const config = readAdminBootstrapConfig(input)
    const first = await bootstrapAdmin(config, { hashPassword, users })
    await bootstrapAdmin(config, { hashPassword, users })

    const accessTokens = createAccessTokenService({
      secret: 'bootstrap-integration-secret-32-bytes',
      lifetimeSeconds: 300,
      issuer: 'mobile-arcade',
      audience: 'mobile-arcade-api',
    })
    const login = await loginUser(
      { email: config.email, password: config.password },
      {
        users: { findForAuthentication: () => Promise.resolve(credentialUser) },
        verifyPassword,
        startSession: async (user) => ({
          accessToken: await accessTokens.issue({ userId: user.id, role: user.role }),
          refreshCookie: 'refresh-cookie',
        }),
      },
    )
    const endpoint = protectAdminEndpoint(
      createRequestAuthenticator(accessTokens),
      (_request: Request, identity: RequestIdentity) => Promise.resolve(Response.json(identity)),
    )
    const response = await endpoint(new Request('http://localhost/api/admin', {
      headers: { authorization: `Bearer ${login.accessToken}` },
    }))

    expect({
      role: first.role,
      loginRole: login.user.role,
      endpointStatus: response.status,
      createdUsers,
    }).toEqual(expected)
  })
})
