# @imayolas Factorial Case

## Case statement

> We want a Frontend + Backend application that allows you to post and visualize metrics. Each metric will have: Timestamp, name, and value. The metrics will be shown in a timeline and must show averages per minute/hour/day The metrics will be persisted in the database.

## Architectural highlights

- Two entrypoints, one for the data ingestor and another for the REST API, so that they can be deployed and scaled independently
- Clickhouse (a columnar data store) as a persistance layer due to its excellent performance at:
  - Its capacity to ingest large amounts of data in real-time, with low overhead.
  - Fast aggregational lookups
  - Transformation and persistance at insertion-time of averages per min/hour/day
- Integration testing to ensure that API acts and responds as expected

## Setting the dev environment

To get the environment up and running, do the following:

1. Be sure to have all the pre-requisites to run the application:

   - Set up `nodejs, npm and yarn` on your local machine (Recommended Nodejs 16 or higher)
   - Set up `docker` and `docker-compose`

2. Install dependencies. Run `yarn`
3. Lift up docker compose; this will set up a Clickhouse instance: `docker-compose up -d`
4. Run a script to create and migrate the Clickhouse dbs for test and dev: `yarn prepareClickhouse`
5. Run a script to add dummy data to the db: `yarn prepareClickhouse`

You're now good to go! Keep reading to see how to start the dev environment

## Starting up the dev environment

1. Lift up the DB if you haven't `docker-compose up -d`
2. Run the test suite in watch mode: `yarn test:watch`
3. Run the APIs in watch mode: `yarn dev`
4. Write amazing code!

## Next steps

- Bundle Typescript for production & create production launch commands
- Move API endpoint validations as part of the request lifecycle
- Unit test key libraries (ie: DbDAO)
- Fix relative paths in code (a weird bug is preventing them from working correctly)
- Put together shared type declarations
