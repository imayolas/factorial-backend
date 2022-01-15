"use strict"

const clickhousefile = require("../../clickhousefile")
const ClickHouse = require("@apla/clickhouse")
const clickhouse = new ClickHouse(clickhousefile)

module.exports.up = function () {
  return clickhouse.querying(`
    CREATE TABLE events
    (
      name String,
      value Decimal64(4),
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(created_at)
    ORDER BY (created_at)
  `)
}

module.exports.down = function () {
  return clickhouse.querying("DROP TABLE events")
}
