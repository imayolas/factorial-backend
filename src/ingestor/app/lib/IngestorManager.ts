import Knex from "knex"

const Clickhouse = require("@apla/clickhouse")
const Dialect = require("knex/lib/dialects/postgres/index.js")
// Dialect.prototype._driver = () => require("sqlite3-offline")

const knex = Knex({
  client: Dialect,
  // connection: ":memory:",
  // useNullAsDefault: true
})

export interface IngestorRequestPayload {
  name: string
  value: number | string | boolean
}

export interface IngestorPayloadValidateResponse {
  success: boolean
  errorMessage?: string
}

interface ClickhouseClientParams {
  host: string
  port: number
  protocol: string
  pathname: string
  timeout: number
  queryOptions: {
    database: string
  }
  migrations: {
    directory: string
  }
}

const CLICKHOUSE_CLIENT_BASE_PARAMS: Partial<ClickhouseClientParams> = {
  host: "localhost",
  port: 8123,
  timeout: 30000,
  queryOptions: {
    database: "default",
  },
}

export default class IngestorManager {
  private clickhouse: any

  static validatePayload(payload: Partial<IngestorRequestPayload>): IngestorPayloadValidateResponse {
    const { name, value } = payload

    if (!name) {
      return { success: false, errorMessage: "name is required" }
    }

    if (!value) {
      return { success: false, errorMessage: "value is required" }
    }

    if (typeof name !== "string") {
      return { success: false, errorMessage: "name should be a string" }
    }

    if (!["string", "number", "boolean"].includes(typeof value)) {
      return { success: false, errorMessage: "value should be a string, number or boolean" }
    }

    return { success: true }
  }

  constructor(clickhouseClientParams: ClickhouseClientParams) {
    this.clickhouse = new Clickhouse({ ...CLICKHOUSE_CLIENT_BASE_PARAMS, ...clickhouseClientParams })
  }

  get clickhouseClient() {
    return this.clickhouse
  }

  async insertEvents(payload: IngestorRequestPayload | IngestorRequestPayload[]) {
    if (!Array.isArray(payload)) {
      payload = [payload, { name: "lorem", value: 4444 }]
    }

    // Use knex query builder to avoid any potential SQL injections
    const query = knex("events").insert(payload).toString()

    return await this.clickhouse.querying(query)
  }
}
