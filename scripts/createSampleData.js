const clickhousefile = require("../clickhousefile")
const ClickHouse = require("@apla/clickhouse")
const Knex = require("knex")
const Dialect = require("knex/lib/dialects/postgres/index.js")
const _ = require("underscore")

const knex = Knex({
  client: Dialect,
})

const clickhouse = new ClickHouse(clickhousefile)

let startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
const now = new Date()

let datePoints = []

while (now >= startDate) {
  datePoints.push(startDate)
  startDate = new Date(startDate.getTime() + 60 * 60 * 1000)
}

let startTemperature = [28, "down"]
let startHumidity = [50, "up"]

const run = async () => {
  const insertableValues = _.flatten(
    datePoints.map((datePoint) => {
      const rand = Math.random()
      startTemperature[0] =
        startTemperature[1] === "up" ? startTemperature[0] + rand / 2 : startTemperature[0] - rand / 2

      startTemperature[0] < 3 && (startTemperature[1] = "up")
      startTemperature[0] > 33 && (startTemperature[1] = "down")

      const stochasticReportedTemperature =
        startTemperature[0] + (Math.random() > 0.5 ? Math.random() * 4 : -Math.random() * 4)

      startHumidity[0] = startHumidity[1] === "up" ? startHumidity[0] + rand / 2 : startHumidity[0] - rand / 2
      if (startHumidity[0] < 20) {
        startHumidity[1] = "up"
      }
      if (startHumidity[0] > 90) {
        startHumidity[1] = "down"
      }
      const stochasticReportedHumidity =
        startHumidity[0] + (Math.random() > 0.5 ? Math.random() * 0.05 : -Math.random() * 0.05)

      const wattsConsumed = Math.floor(Math.random() * 1000) + 1000

      return [
        {
          created_at: datePoint.toISOString().substring(0, 19).replace("T", " "),
          name: "temperature",
          value: stochasticReportedTemperature,
        },
        {
          created_at: datePoint.toISOString().substring(0, 19).replace("T", " "),
          name: "humidity",
          value: stochasticReportedHumidity,
        },
        {
          created_at: datePoint.toISOString().substring(0, 19).replace("T", " "),
          name: "watts_consumed",
          value: wattsConsumed,
        },
      ]
    })
  )

  const query = knex("events").insert(insertableValues).toString()
  await clickhouse.querying(query)
}

run().then(console.log).catch(console.error).finally(process.exit)
