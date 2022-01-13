import ingestorServer from "./ingestorServer"

const port: string = process.env.PORT || "4000"

ingestorServer.listen(port, () => {
  console.log(`Server started on port ${port}`)
})
