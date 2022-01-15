module.exports = {
  host: "localhost",
  port: 8123,
  protocol: "http:",
  pathname: "/",
  timeout: 30000,
  queryOptions: {
    database: "default",
  },
  migrations: {
    directory: "./migrations/clickhouse",
  },
}
