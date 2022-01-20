import express from "express"
import bodyParser from "body-parser"
import DbDAO from "../../common/DbDAO"

const dbName = process.env.CLICKHOUSE_DBNAME
const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use((error: Error, req: any, res: any, next: any) => {
  console.error(error.stack)
  res.status(500).send("Internal server error")
})

app.post("/track", async function (req, res) {
  try {
    await dbDAO.insertEvent(req.body)
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message })
    }
    throw error
  }

  return res.status(201).json({ success: true })
})

export default app
