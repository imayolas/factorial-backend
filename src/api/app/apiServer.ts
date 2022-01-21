import express from "express"
import bodyParser from "body-parser"
import { getDimensions, getMetrics } from "./controllers/metricsCtrl"
import cors from "cors"

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use((error: Error, req: any, res: any, next: any) => {
  console.error(error.stack)
  res.status(500).send("Internal server error")
})

app.get("/dimensions", getDimensions)
app.get("/metrics", getMetrics)

// Export to be used to enable port listening + for testing purposes
export default app
