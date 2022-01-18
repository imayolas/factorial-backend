import { expect } from "chai"
import request from "supertest"
import apiServer from "@api/apiServer"
import DbDAO, { GetMetricsResponse } from "shared/DbDAO"
import { truncateAllTables } from "shared/testUtils"

const dbName = process.env.CLICKHOUSE_DBNAME || "default"
const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

const setClickhouseFixture = async () => {
  await truncateAllTables(dbName)
  await dbDAO.raw(`
    INSERT INTO events (name, value)
    VALUES
      ('purchaseAmount', 100),
      ('purchaseAmount', 200),
      ('orderQuantity', 5)
  `)
}

const getMetrics = async (query: { [key: string]: any }) => {
  return await request(apiServer).get("/metrics").query(query).set("Accept", "application/json")
}

describe("REST API, GET /data", () => {
  beforeEach(async function () {
    await setClickhouseFixture()
  })

  after(async function () {
    await truncateAllTables(dbName)
  })

  describe("when query params are valid", () => {
    beforeEach(async function () {
      this.context = {
        query: {
          groupBy: "minute",
        },
      }
    })

    it("should return 201 created", async function () {
      const res = await getMetrics(this.context.query)
      expect(res.statusCode).to.equal(200)
    })

    it("should return tracking metrics", async function () {
      const res = await getMetrics(this.context.query)

      const purchaseAmount: GetMetricsResponse = res.body.data.find(
        (d: GetMetricsResponse) => d.name === "purchaseAmount"
      )
      const orderQuantity: GetMetricsResponse = res.body.data.find(
        (d: GetMetricsResponse) => d.name === "orderQuantity"
      )

      expect(Number(purchaseAmount.average)).to.equal(150)
      expect(Number(orderQuantity.average)).to.equal(5)
    })

    xit("when groupBy=day, should group by day")
    xit("when groupBy=hour, should group by hour")
    xit("when groupBy=minute, should group by minute")
    xit("when dateFrom is set, should return only events after that date")
    xit("when dateTo is set, should return only events before that date")
  })

  describe("when query params are invalid", () => {
    xit("should return 400 upon an empty groupBy")
    xit("should return 400 upon a non-string groupBy")
    xit("should return 400 upon an invalid groupBy")
    xit("should return 400 upon an invalid dateFrom")
    xit("should return 400 upon an invalid dateTo")
  })
})
