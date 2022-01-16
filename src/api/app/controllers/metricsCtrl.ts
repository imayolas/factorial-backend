import { Request, Response } from "express"
import DbDAO from "../../../shared/DbDAO"

const dbName = process.env.CLICKHOUSE_DBNAME

const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

export const getMetrics = async (req: Request, res: Response) => {
  const dbResult = await dbDAO.getMetrics()
  return res.status(200).json(dbResult)
}
