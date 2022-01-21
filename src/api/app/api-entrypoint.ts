import apiServer from "./apiServer"
import { API_PORT } from "../../config/AppConstants"

apiServer.listen(API_PORT, () => {
  console.log(`Server started on port ${API_PORT}`)
})
