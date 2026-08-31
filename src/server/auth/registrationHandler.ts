import { RegistrationError } from './registrationErrors'
import { registerUser, type RegistrationDependencies } from './registrationService'

interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status })
}

export function createRegistrationHandler(dependencies: RegistrationDependencies) {
  return async function handleRegistration(request: Request): Promise<Response> {
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse({ error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' } } satisfies ErrorResponse, 400)
    }

    try {
      const user = await registerUser(requestBody, dependencies)
      return jsonResponse({ user }, 201)
    } catch (error) {
      if (error instanceof RegistrationError) {
        const status = error.code === 'DUPLICATE_EMAIL' ? 409 : 400
        return jsonResponse({ error: { code: error.code, message: error.message } } satisfies ErrorResponse, status)
      }
      throw error
    }
  }
}
