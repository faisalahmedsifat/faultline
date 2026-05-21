import { createServer } from "node:http"

const port = Number(process.env.PORT ?? 4000)

const server = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" })
  res.end(
    JSON.stringify({
      service: "api",
      status: "ok",
      message: "faultline API scaffold"
    })
  )
})

server.listen(port, () => {
  console.log(`faultline api listening on http://localhost:${port}`)
})
