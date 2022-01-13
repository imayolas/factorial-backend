import express from "express"
import bodyParser from "body-parser"

// Instantiate express
const app = express()

// Inject middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Add a single to ingest data
app.post("/track", function (req, res) {
  res.status(201).json({ success: "true" })
})

// Export to be used to enable port listening + for testing purposes
export default app
