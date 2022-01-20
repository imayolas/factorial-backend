import { Request, Response } from "express"
import DbDAO from "../../../common/DbDAO"
import _ from "underscore"

const dbName = process.env.CLICKHOUSE_DBNAME

const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const dbResult = await dbDAO.getMetrics(req.query)
    let dataGroupedByMetric: { [key: string]: Array<[Date, number]> } = {}
    dbResult.data.forEach((row) => {
      if (!dataGroupedByMetric[row.name]) {
        dataGroupedByMetric[row.name] = [[row.start_date, row.average]]
      } else {
        dataGroupedByMetric[row.name].push([row.start_date, row.average])
      }
    })

    return res.status(200).json(dataGroupedByMetric)
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message })
    }
    throw error
  }
}
