import { expect } from "chai"
import request from "supertest"
import apiServer from "@api/apiServer"
import DbDAO, { NameValuePayload } from "shared/DbDAO"

const dbName = process.env.CLICKHOUSE_DBNAME
const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

const setClickhouseFixture = async () => {
  await runClickhouseQuery("TRUNCATE TABLE IF EXISTS events")
  await runClickhouseQuery(`
    INSERT INTO events (name, value)
    VALUES
      ('purchaseAmount', 100),
      ('purchaseAmount', 200),
      ('orderQuantity', 5)
  `)
}

const getMetrics = async () => {
  return await request(apiServer).get("/metrics").set("Accept", "application/json")
}

const runClickhouseQuery = async (query: string) => {
  const clickhouse = dbDAO.clickhouseClient
  const res = await clickhouse.querying(query)
  return res
}

describe.only("REST API, GET /data", () => {
  before(async () => {
    await setClickhouseFixture()
  })

  it("should return tracking metrics", async () => {
    const res = await getMetrics()

    const purchaseAmount: NameValuePayload = res.body.data.find((d: NameValuePayload) => d.name === "purchaseAmount")
    const orderQuantity: NameValuePayload = res.body.data.find((d: NameValuePayload) => d.name === "orderQuantity")

    expect(Number(purchaseAmount.value)).to.equal(150)
    expect(Number(orderQuantity.value)).to.equal(5)
  })
})
