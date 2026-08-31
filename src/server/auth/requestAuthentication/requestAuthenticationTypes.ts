import type { UserRole } from '../../../shared/auth'

export interface RequestIdentity {
  userId: string
  role: UserRole
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<{ userId: string; role: UserRole }>
}

export interface RequestAuthenticator {
  authenticate(request: Request): Promise<RequestIdentity>
}

export interface AuthenticatedRequestHandler {
  (request: Request, identity: RequestIdentity): Promise<Response>
}
