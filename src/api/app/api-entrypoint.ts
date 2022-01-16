import apiServer from "./apiServer"

const port: string = process.env.API_PORT || "4001"

apiServer.listen(port, () => {
  console.log(`Server started on port ${port}`)
})
