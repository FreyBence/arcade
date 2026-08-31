import { RequestAuthenticationError } from './requestAuthenticationErrors'

export function readBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization')
  if (!authorization) throw new RequestAuthenticationError('MISSING_ACCESS_TOKEN')

  const match = /^Bearer ([^\s]+)$/i.exec(authorization)
  if (!match?.[1]) throw new RequestAuthenticationError('INVALID_ACCESS_TOKEN')
  return match[1]
}
