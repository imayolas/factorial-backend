import { expect } from "chai"
import request from "supertest"
import ingestorServer from "@modules/ingestor/ingestorServer"
import IngestorManager from "@modules/ingestor/lib/IngestorManager"

const clickhousefile = require("../../../../clickhousefile.js")
const ingestorManager = new IngestorManager(clickhousefile)

const postTrackEvent = async (payload: any) => {
  return await request(ingestorServer).post("/track").set("Accept", "application/json").send(payload)
}

const runClickhouseQuery = async (query: string) => {
  const clickhouse = ingestorManager.clickhouseClient
  const res = await clickhouse.querying(query)
  return res
}

describe("Data ingestor API, POST /track", () => {
  describe("when payload is valid", () => {
    beforeEach(async function () {
      this.context = {
        payload: {
          name: "purchaseAmount",
          value: 100,
        },
      }
      await runClickhouseQuery("TRUNCATE TABLE IF EXISTS events")
    })

    it("should return 201 created", async function () {
      const res = await postTrackEvent(this.context.payload)
      expect(res.statusCode).to.equal(201)
    })

    it("should insert the event in the database", async function () {
      await postTrackEvent(this.context.payload)
      const dbResponse = await runClickhouseQuery(`SELECT count(1) as count from events FORMAT JSON`)
      expect(Number(dbResponse.data[0].count)).to.equal(2)
      const dbResponse2 = await runClickhouseQuery(`SELECT * from events FORMAT JSON`)
      expect(dbResponse2.data[0].name).to.equal("purchaseAmount")
      expect(Number(dbResponse2.data[0].value)).to.equal(100)
    })
  })

  describe("when payload is invalid", () => {
    it("should fail if param name is undefined", async () => {
      const payload = {
        value: 123,
      }
      const res = await postTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("name is required")
    })

    it("should fail if param name is not a string", async () => {
      const payload: { name: any; value: number } = {
        name: 123,
        value: 123,
      }
      const res = await postTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("name should be a string")

      payload.name = { key: "a nested value" }

      const res2 = await postTrackEvent(payload)
      expect(res2.statusCode).to.equal(400)
      expect(res2.body.errorMessage).to.equal("name should be a string")
    })

    it("should fail if param value is undefined", async () => {
      const payload = {
        name: "test",
      }
      const res = await postTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("value is required")
    })

    it("should fail with a 400 error when param value is not a string", async () => {
      const payload: { name: string; value: any } = {
        name: "test",
        value: { key: "a nested object" },
      }
      const res = await postTrackEvent(payload)
      expect(res.statusCode).to.equal(400)
      expect(res.body.errorMessage).to.equal("value should be a string, number or boolean")

      payload.value = { key: [1, 2, 3] }
      const res2 = await postTrackEvent(payload)
      expect(res2.statusCode).to.equal(400)
      expect(res2.body.errorMessage).to.equal("value should be a string, number or boolean")
    })
  })
})
