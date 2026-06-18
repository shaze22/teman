export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  unauthorized: (msg = 'Unauthorized') => new AppError(msg, 401, 'UNAUTHORIZED'),
  forbidden: (msg = 'Forbidden') => new AppError(msg, 403, 'FORBIDDEN'),
  notFound: (entity = 'Resource') => new AppError(`${entity} not found`, 404, 'NOT_FOUND'),
  conflict: (msg: string) => new AppError(msg, 409, 'CONFLICT'),
  unprocessable: (msg: string) => new AppError(msg, 422, 'UNPROCESSABLE'),
  badRequest: (msg: string) => new AppError(msg, 400, 'BAD_REQUEST'),
  serverError: (msg = 'Internal server error') => new AppError(msg, 500, 'SERVER_ERROR'),
} as const

export function toErrorResponse(err: unknown): { message: string; status: number } {
  if (err instanceof AppError) return { message: err.message, status: err.status }
  if (err instanceof Error) return { message: err.message, status: 500 }
  return { message: 'An unexpected error occurred', status: 500 }
}
