import { expect } from "chai"
import request from "supertest"
import ingestorServer from "../../app/ingestorServer"

describe("Data ingestor API", () => {
  it("should return 201 created", async () => {
    const res = await request(ingestorServer).post("/track")
    expect(res.statusCode).to.equal(201)
  })
})
