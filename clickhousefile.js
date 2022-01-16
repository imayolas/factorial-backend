const dbName = process.env.CLICKHOUSE_DBNAME || "default"

module.exports = {
  host: "localhost",
  port: 8123,
  protocol: "http:",
  pathname: "/",
  timeout: 30000,
  queryOptions: {
    database: dbName,
  },
  migrations: {
    directory: "./migrations/clickhouse",
  },
}
