export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(params: {
    message: string
    statusCode: number
    code: string
    details?: unknown
  }) {
    super(params.message)
    this.name = "AppError"
    this.statusCode = params.statusCode
    this.code = params.code
    this.details = params.details
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}

