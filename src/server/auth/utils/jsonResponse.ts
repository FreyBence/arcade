export function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status })
}
