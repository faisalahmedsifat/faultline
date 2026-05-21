import { FaultlineClient } from "./client"
import type { CaptureContext, ExpressLikeNext, ExpressLikeRequest } from "./types"

export class FaultlineMiddleware extends FaultlineClient {
  withCapture<TArgs extends unknown[], TResult>(
    handler: (...args: TArgs) => TResult | Promise<TResult>,
    getContext?: (error: unknown, args: TArgs) => CaptureContext
  ) {
    return async (...args: TArgs): Promise<TResult> => {
      try {
        return await handler(...args)
      } catch (error) {
        const context = getContext ? getContext(error, args) : inferContextFromArgs(args)
        await this.capture(error, context)
        throw error
      }
    }
  }

  expressHandler() {
    return async (
      error: unknown,
      req: ExpressLikeRequest,
      _res: unknown,
      next: ExpressLikeNext
    ) => {
      await this.capture(error, {
        route: req.originalUrl ?? req.route?.path ?? req.url
      })

      next(error)
    }
  }
}

function inferContextFromArgs(args: unknown[]): CaptureContext {
  const [first] = args

  if (first && typeof first === "object" && "url" in first && typeof first.url === "string") {
    try {
      const url = new URL(first.url)
      return { route: url.pathname }
    } catch {
      return { route: first.url }
    }
  }

  return {}
}

