import express from "express"
import bodyParser from "body-parser"
import IngestorManager from "./IngestorManager"
// Instantiate express
const app = express()

// Inject middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use((error: Error, req: any, res: any, next: any) => {
  console.error(error.stack)
  res.status(500).send("Internal server error")
})

// Add a single to ingest data
app.post("/track", async function (req, res) {
  const validPayload = IngestorManager.validatePayload(req.body)

  if (!validPayload.success) {
    return res.status(400).json({ errorMessage: validPayload.errorMessage })
  }

  return res.status(201).json({ success: "true" })
})

// Export to be used to enable port listening + for testing purposes
export default app
