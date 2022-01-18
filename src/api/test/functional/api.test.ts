import { expect } from "chai"
import request from "supertest"
import apiServer from "@api/apiServer"
import DbDAO, { NameValuePayload } from "shared/DbDAO"
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

      const purchaseAmount: NameValuePayload = res.body.data.find((d: NameValuePayload) => d.name === "purchaseAmount")
      const orderQuantity: NameValuePayload = res.body.data.find((d: NameValuePayload) => d.name === "orderQuantity")

      expect(Number(purchaseAmount.value)).to.equal(150)
      expect(Number(orderQuantity.value)).to.equal(5)
    })
  })

  describe("when query params are invalid", () => {
    xit("should return 400 upon an empty groupBy")
    xit("should return 400 upon a non-string groupBy")
    xit("should return 400 upon an invalid groupBy")
    xit("should return 400 upon an invalid dateFrom")
    xit("should return 400 upon an invalid dateTo")
  })
})
