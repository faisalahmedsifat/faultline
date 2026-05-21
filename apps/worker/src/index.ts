const redisUrl = process.env.REDIS_URL ?? "redis://redis:6379"

console.log("faultline worker scaffold")
console.log(`configured redis: ${redisUrl}`)

setInterval(() => {
  console.log("worker heartbeat")
}, 30000)

