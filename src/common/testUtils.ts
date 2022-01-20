import DbDAO from "common/DbDAO"
import _ from "underscore"
import Promise from "bluebird"

export const truncateAllTables = async (dbName: string) => {
  const dbDAO = new DbDAO({ queryOptions: { database: dbName } })
  const dbResponse = await dbDAO.raw(`SHOW TABLES`)

  const tables = _.flatten(dbResponse.data).filter((table: string) => !table.startsWith("."))

  await Promise.map(tables, async (table: string) => {
    await dbDAO.raw(`TRUNCATE TABLE ${table}`)
  })
}
