import Knex from "knex"
import { isDateString, dateToClickhouseDateString } from "./DbDAO.utils"
import {
  ClickhouseQueryResponse,
  ClickhouseClientParams,
  GetMetricsResponse,
  GetMetricsParams,
  NameValuePayload,
} from "."

const Clickhouse = require("@apla/clickhouse")
const Dialect = require("knex/lib/dialects/postgres/index.js")

const knex = Knex({
  client: Dialect,
})

enum GroupByTimeOptions {
  MINUTE = "minute",
  HOUR = "hour",
  DAY = "day",
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

const CLICKHOUSE_CLIENT_DEFAULT_PARAMS: ClickhouseClientParams = {
  host: "localhost",
  port: 8123,
  protocol: "http:",
  timeout: 30000,
  queryOptions: {
    database: "default",
  },
}

export default class DbDAO {
  private clickhouse: any

  private static validateInsertEventsPayload(payload: Partial<NameValuePayload>): boolean | ValidationError {
    const { name, value } = payload

    if (!name) {
      throw new ValidationError("name is required")
    }

    if (!value) {
      throw new ValidationError("value is required")
    }

    if (typeof name !== "string") {
      throw new ValidationError("name should be a string")
    }

    if (!["number"].includes(typeof value)) {
      throw new ValidationError("value should be a number")
    }

    return true
  }

  private static validateGetMetricsParams(payload: Partial<GetMetricsParams>): boolean | ValidationError {
    const { groupBy, dateFrom, dateTo } = payload

    if (!groupBy) {
      throw new ValidationError("groupBy parameter is required")
    }

    if (typeof groupBy !== "string") {
      throw new ValidationError("groupBy should be a string")
    }
    const groupByTimeOptions: string[] = Object.values(GroupByTimeOptions)

    if (!groupByTimeOptions.includes(groupBy)) {
      throw new ValidationError(`groupBy should equal to one of '${groupByTimeOptions.join(", ")}'`)
    }

    if (dateFrom && !isDateString(dateFrom)) {
      throw new ValidationError("dateFrom should be a valid date string")
    }

    if (dateTo && !isDateString(dateTo)) {
      throw new ValidationError("dateTo should be a valid date string")
    }

    return true
  }

  constructor(clickhouseClientParams: Partial<ClickhouseClientParams>) {
    const params: ClickhouseClientParams = { ...CLICKHOUSE_CLIENT_DEFAULT_PARAMS, ...clickhouseClientParams }
    this.clickhouse = new Clickhouse(params)
  }

  get clickhouseClient() {
    return this.clickhouse
  }

  async insertEvent(payload: NameValuePayload): Promise<void> {
    DbDAO.validateInsertEventsPayload(payload)

    // Use knex query builder to avoid any potential SQL injections
    const query = knex("events").insert(payload).toString()
    await this.clickhouse.querying(query)
  }

  async getMetrics(params: Partial<GetMetricsParams>): Promise<ClickhouseQueryResponse<GetMetricsResponse>> {
    DbDAO.validateGetMetricsParams(params)
    const { groupBy, dateFrom = new Date("2000-01-01"), dateTo = new Date() } = params

    let targetClickhouseGroupFunc: string
    switch (groupBy) {
      case GroupByTimeOptions.MINUTE:
        targetClickhouseGroupFunc = "toStartOfMinute"
        break
      case GroupByTimeOptions.HOUR:
        targetClickhouseGroupFunc = "toStartOfHour"
        break
      case GroupByTimeOptions.DAY:
        targetClickhouseGroupFunc = "toStartOfDay"
        break
      default:
        throw new Error(`Unknown groupBy option: ${groupBy}`)
    }

    const query = knex
      .raw(
        `
      SELECT name,
        ${targetClickhouseGroupFunc}(created_at) as start_date,
        avg(value) as average
      FROM events
      WHERE created_at >= ?
      AND created_at <= ?
      GROUP BY name, start_date
      FORMAT JSON
    `,
        [dateToClickhouseDateString(dateFrom), dateToClickhouseDateString(dateTo)]
      )
      .toString()

    return await this.clickhouse.querying(query)
  }

  async raw(query: string): Promise<ClickhouseQueryResponse<any>> {
    return await this.clickhouse.querying(query)
  }
}
