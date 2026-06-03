export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return Response.json(
    { ok: false, error: message, details },
    { status },
  );
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

export function ensureRequiredFields(
  payload: Record<string, unknown>,
  requiredFields: string[],
) {
  const missingFields = requiredFields.filter((field) => {
    const value = payload[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}
