import { LoginError } from './loginErrors'
import { loginUser, type LoginDependencies } from './loginService'

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status })
}

export function createLoginHandler(dependencies: LoginDependencies) {
  return async function handleLogin(request: Request): Promise<Response> {
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse({ error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' } }, 400)
    }

    try {
      const user = await loginUser(requestBody, dependencies)
      return jsonResponse({ user }, 200)
    } catch (error) {
      if (error instanceof LoginError) {
        const status = error.code === 'INVALID_CREDENTIALS' ? 401 : 400
        return jsonResponse({ error: { code: error.code, message: error.message } }, status)
      }
      throw error
    }
  }
}
