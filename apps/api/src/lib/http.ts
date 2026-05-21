import type { Context } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { ZodError } from "zod"

import { AppError, isAppError } from "./errors"

type ErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function jsonOk<T>(c: Context, data: T, status = 200) {
  return c.json(data, status as ContentfulStatusCode)
}

export function jsonError(
  c: Context,
  params: {
    code: string
    message: string
    status: number
    details?: unknown
  }
) {
  const body: ErrorBody = {
    error: {
      code: params.code,
      message: params.message,
      details: params.details
    }
  }

  return c.json(body, params.status as ContentfulStatusCode)
}

export function toAppError(error: unknown) {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof ZodError) {
    return new AppError({
      message: "Invalid request payload",
      code: "invalid_request",
      statusCode: 400,
      details: error.flatten()
    })
  }

  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: "internal_error",
      statusCode: 500
    })
  }

  return new AppError({
    message: "Unexpected error",
    code: "internal_error",
    statusCode: 500
  })
}
