export class Faultline {
  constructor(readonly options: { dsn?: string; env?: string; enabled?: boolean } = {}) {}

  capture(_error: unknown, _context?: Record<string, unknown>) {
    if (this.options.enabled === false) {
      return Promise.resolve(undefined)
    }

    return Promise.resolve(undefined)
  }
}
