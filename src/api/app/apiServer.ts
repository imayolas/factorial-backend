import express from "express"
import bodyParser from "body-parser"
import { getMetrics } from "./controllers/metricsCtrl"

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use((error: Error, req: any, res: any, next: any) => {
  console.error(error.stack)
  res.status(500).send("Internal server error")
})

app.get("/metrics", getMetrics)

// Export to be used to enable port listening + for testing purposes
export default app
