import { Faultline } from "../src/index"

// Zero config — reads FAULTLINE_DSN and FAULTLINE_BASE_URL from env
// Set FAULTLINE_DSN=your_project_key and FAULTLINE_BASE_URL=http://localhost:4000
const faultline = new Faultline({ debug: true })

// Or explicit:
// const faultline = new Faultline({
//   dsn: "LV0l2yhx7QtWCkoumWCw660e",
//   baseUrl: "http://localhost:4000"
// })

await faultline.capture(new Error("Example error"), {
  route: "/api/example",
  metadata: { example: true }
})
