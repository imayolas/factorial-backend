import { expect } from "chai"
import request from "supertest"
import ingestorServer from "@ingestor/ingestorServer"
import DbDAO from "shared/DbDAO"
import { truncateAllTables } from "shared/testUtils"

const dbName = process.env.CLICKHOUSE_DBNAME || "default"
const dbDAO = new DbDAO({ queryOptions: { database: dbName } })

const sendTrackEvent = async (payload: any) => {
  return await request(ingestorServer).post("/track").set("Accept", "application/json").send(payload)
}

describe("Data ingestor API, POST /track", () => {
  describe("when payload is valid", () => {
    beforeEach(async function () {
      await truncateAllTables(dbName)
      this.context = {
        payload: {
          name: "purchaseAmount",
          value: 100,
        },
      }
      await dbDAO.raw("TRUNCATE TABLE IF EXISTS events")
    })

    after(async function () {
      await truncateAllTables(dbName)
    })

    it("should return 201 created", async function () {
      const res = await sendTrackEvent(this.context.payload)
      expect(res.statusCode).to.equal(201)
    })

    it("should return a success message", async function () {
      const res = await sendTrackEvent(this.context.payload)
      expect(res.body).to.deep.equal({ success: true })
    })

    it("should insert the event in the database", async function () {
      await sendTrackEvent(this.context.payload)
      await sendTrackEvent(this.context.payload)

      const dbResponse = await dbDAO.raw(`SELECT count(1) as count from events FORMAT JSON`)
      expect(Number(dbResponse.data[0].count)).to.equal(2)

      const dbResponse2 = await dbDAO.raw(`SELECT * from events FORMAT JSON`)
      expect(dbResponse2.data[0].name).to.equal("purchaseAmount")
      expect(Number(dbResponse2.data[0].value)).to.equal(100)
    })
  })

  describe("when payload is invalid", () => {
    it("should fail if param name is undefined", async () => {
      const payload = {
        value: 123,
      }
      const res = await sendTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("name is required")
    })

    it("should fail if param name is not a string", async () => {
      const payload: { name: any; value: number } = {
        name: 123,
        value: 123,
      }
      const res = await sendTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("name should be a string")

      payload.name = { key: "a nested value" }

      const res2 = await sendTrackEvent(payload)
      expect(res2.statusCode).to.equal(400)
      expect(res2.body.errorMessage).to.equal("name should be a string")
    })

    it("should fail if param value is undefined", async () => {
      const payload = {
        name: "test",
      }
      const res = await sendTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("value is required")
    })

    it("should fail with a 400 error when param value is not a string", async () => {
      const payload: { name: string; value: any } = {
        name: "test",
        value: { key: "a nested object" },
      }
      const res = await sendTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("value should be a number")

      payload.value = { key: [1, 2, 3] }
      const res2 = await sendTrackEvent(payload)
      expect(res2.statusCode).to.equal(400)
      expect(res2.body.errorMessage).to.equal("value should be a number")
    })
  })
})
