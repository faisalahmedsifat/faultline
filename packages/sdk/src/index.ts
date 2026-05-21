export { FaultlineClient } from "./client"
export { FaultlineMiddleware } from "./middleware"
export type {
  CaptureContext,
  ExpressLikeNext,
  ExpressLikeRequest,
  FaultlineOptions,
  IngestPayload
} from "./types"

import { FaultlineClient } from "./client"
import { FaultlineMiddleware } from "./middleware"
import type { FaultlineOptions } from "./types"

export class Faultline extends FaultlineMiddleware {
  constructor(options: FaultlineOptions = {}) {
    super(options)
  }
}
