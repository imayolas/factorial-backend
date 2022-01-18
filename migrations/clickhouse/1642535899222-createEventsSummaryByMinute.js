"use strict"

const clickhousefile = require("../../clickhousefile")
const ClickHouse = require("@apla/clickhouse")
const clickhouse = new ClickHouse(clickhousefile)

module.exports.up = function () {
  return clickhouse.querying(`
    CREATE MATERIALIZED VIEW summarized_events_by_minute
    ENGINE = SummingMergeTree
    PARTITION BY toYYYYMM(start_date) ORDER BY (name, start_date)
    POPULATE
    AS select name, toStartOfMinute(created_at) as start_date, avg(value) as average
    from events group by name, start_date
  `)
}

module.exports.down = function () {
  return clickhouse.querying("DROP VIEW summarized_events_by_minute")
}
