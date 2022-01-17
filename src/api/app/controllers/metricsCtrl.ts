import { Request, Response } from "express"
import DbDAO from "../../../shared/DbDAO"

const dbName = process.env.CLICKHOUSE_DBNAME

const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const dbResult = await dbDAO.getMetrics(req.query)
    return res.status(200).json(dbResult)
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message })
    }
    throw error
  }
}
