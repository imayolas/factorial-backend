import { Request, Response } from "express"
import DbDAO from "../../../common/DbDAO"
import _ from "underscore"
import { CLICKHOUSE_DBNAME } from "../../../config/AppConstants"

const dbDAO = new DbDAO({ queryOptions: { database: CLICKHOUSE_DBNAME } })

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const dbResult = await dbDAO.getMetrics(req.query)
    let dataGroupedByMetric: { [key: string]: Array<[Date, number]> } = {}
    dbResult.data.forEach((row) => {
      dataGroupedByMetric[row.name] = [...(dataGroupedByMetric[row.name] || []), [row.start_date, row.average]]
    })

    return res.status(200).json(dataGroupedByMetric)
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({ errorMessage: error.message })
    }
    throw error
  }
}
