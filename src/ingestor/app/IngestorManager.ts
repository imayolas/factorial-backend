export interface IngestorRequestPayload {
  name: string
  value: number | string | boolean
}

export interface IngestorPayloadValidateResponse {
  success: boolean
  errorMessage?: string
}

export default class IngestorManager {
  static validatePayload(payload: Partial<IngestorRequestPayload>): IngestorPayloadValidateResponse {
    const { name, value } = payload

    if (!name) {
      return { success: false, errorMessage: "name is required" }
    }

    if (typeof name !== "string") {
      return { success: false, errorMessage: "name should be a string" }
    }
    return { success: true }
  }
}