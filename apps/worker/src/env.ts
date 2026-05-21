import { z } from "zod"

const emptyStringToUndefined = z.preprocess((value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}, z.string().optional())

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: emptyStringToUndefined,
  RESEND_FROM: z.preprocess((value: unknown) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined
    }

    return value
  }, z.string().email().optional())
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid worker environment configuration")
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
