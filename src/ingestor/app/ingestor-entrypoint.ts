import ingestorServer from "./ingestorServer"
import { INGESTOR_PORT } from "../../config/AppConstants"

ingestorServer.listen(INGESTOR_PORT, () => {
  console.log(`Server started on port ${INGESTOR_PORT}`)
})
