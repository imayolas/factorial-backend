import { expect } from "chai"
import request from "supertest"
import apiServer from "@api/apiServer"
import DbDAO, { GetMetricsResponse } from "common/DbDAO"
import { truncateAllTables } from "common/testUtils"

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

  it("should return a valid CORS header", async () => {
    const res = await getMetrics({
      groupBy: "minute",
    })
    expect(res.header["access-control-allow-origin"]).to.equal("*")
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

      expect(res.body.purchaseAmount).to.be.an("array")
      expect(Number(res.body.purchaseAmount[0][1])).to.equal(150)
      expect(res.body.orderQuantity).to.be.an("array")
      expect(Number(res.body.orderQuantity[0][1])).to.equal(5)
    })

    it("when groupBy=day, should return avg grouped by day", async function () {
      await dbDAO.raw(`
        INSERT INTO events (name, value, created_at)
        VALUES
        ('purchaseAmount', 400, '2022-01-01 00:00:00'),
        ('purchaseAmount', 500, '2022-01-01 13:15:00'),
      `)

      const res = await getMetrics({ groupBy: "day" })
      const { purchaseAmount } = res.body
      const purchaseAmountTargetRow = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-01 00:00:00")
      expect(purchaseAmountTargetRow[1]).to.equal(450)
    })

    it("when groupBy=hour, should group by hour", async function () {
      await dbDAO.raw(`
        INSERT INTO events (name, value, created_at)
        VALUES
        ('purchaseAmount', 300, '2022-01-01 00:00:00'),
        ('purchaseAmount', 600, '2022-01-01 00:45:30'),
        ('purchaseAmount', 500, '2022-01-01 13:15:00'),
      `)

      const res = await getMetrics({ groupBy: "hour" })
      const { purchaseAmount } = res.body

      const purchaseAmountTargetRow = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-01 00:00:00")
      expect(purchaseAmountTargetRow[1]).to.equal(450)
    })

    it("when groupBy=minute, should group by minute", async function () {
      await dbDAO.raw(`
        INSERT INTO events (name, value, created_at)
        VALUES
        ('purchaseAmount', 300, '2022-01-01 00:00:00'),
        ('purchaseAmount', 600, '2022-01-01 00:00:02'),
        ('purchaseAmount', 500, '2022-01-01 13:15:00'),
      `)

      const res = await getMetrics({ groupBy: "minute" })
      const { purchaseAmount } = res.body

      const purchaseAmountTargetRow = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-01 00:00:00")
      expect(purchaseAmountTargetRow[1]).to.equal(450)
    })

    it("when dateFrom is set, should return only events after that date", async function () {
      await dbDAO.raw(`
        INSERT INTO events (name, value, created_at)
        VALUES
        ('purchaseAmount', 300, '2022-01-01 00:00:00'),
        ('purchaseAmount', 600, '2022-01-01 00:00:02'),
        ('purchaseAmount', 500, '2022-01-12 13:15:00'),
      `)

      const res = await getMetrics({ groupBy: "day", dateFrom: new Date("2022-01-12") })
      const { purchaseAmount } = res.body

      const targetRowNull = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-01 00:00:00")
      const targetRowExists = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-12 00:00:00")

      expect(targetRowNull).to.be.undefined
      expect(targetRowExists[1]).to.equal(500)
    })

    it("when dateTo is set, should return only events before that date", async function () {
      await dbDAO.raw(`
        INSERT INTO events (name, value, created_at)
        VALUES
        ('purchaseAmount', 300, '2022-01-01 00:00:00'),
        ('purchaseAmount', 600, '2022-01-01 00:00:02'),
        ('purchaseAmount', 500, '2022-01-12 13:15:00'),
      `)

      const res = await getMetrics({ groupBy: "day", dateTo: new Date("2022-01-02 00:00:00") })

      const { purchaseAmount } = res.body

      const targetRowNull = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-12 00:00:00")
      const targetRowExists = purchaseAmount.find((row: [string, number]) => row[0] === "2022-01-01 00:00:00")

      expect(targetRowNull).to.be.undefined
      expect(targetRowExists[1]).to.equal(450)
    })
  })

  describe("when query params are invalid", () => {
    it("should return 400 upon an empty groupBy", async function () {
      const res = await getMetrics({
        groupBy: "",
      })
      expect(res.statusCode).to.equal(400)
    })

    it("should return 400 upon a non-string groupBy", async function () {
      const res = await getMetrics({
        groupBy: [1, 2, 3],
      })
      expect(res.statusCode).to.equal(400)
    })

    it("should return 400 upon an invalid groupBy option", async function () {
      const res = await getMetrics({
        groupBy: "tomato",
      })
      expect(res.statusCode).to.equal(400)
    })

    it("should return 400 upon an invalid dateFrom", async function () {
      const res = await getMetrics({
        dateFrom: "tomato",
      })
      expect(res.statusCode).to.equal(400)
    })

    it("should return 400 upon an invalid dateTo", async function () {
      const res = await getMetrics({
        dateTo: "tomato",
      })
      expect(res.statusCode).to.equal(400)
    })
  })
})
